import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Bell, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  type: "clock_in" | "leave_request" | "issue_assigned" | "leave_approved" | "leave_rejected" | "issue_comment";
  title: string;
  message: string;
  action?: () => void;
  link?: string;
}

export function NotificationPopup() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(new Set());
  const shownNotificationIdsRef = useRef<Set<string>>(new Set());
  const navigate = useNavigate();

  // Keep ref in sync with state
  useEffect(() => {
    shownNotificationIdsRef.current = shownNotificationIds;
  }, [shownNotificationIds]);

  useEffect(() => {
    checkNotifications();
    
    // Check every 30 minutes for new notifications (reduced frequency to avoid spam)
    const interval = setInterval(() => {
      // Only check if popup was already shown (to avoid re-triggering)
      if (hasChecked) {
        checkNotifications();
      }
    }, 30 * 60 * 1000);
    
    // Subscribe to real-time notifications from database
    const subscription = supabase
      .channel("notification-popup")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          // Show toast for new database notifications in real-time (but only if popup was already shown)
          if (payload.new && hasChecked) {
            const newNotification = payload.new as any;
            const notificationId = newNotification.id;
            
            // Check if this notification is for the current user and hasn't been shown
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session?.user && newNotification.user_id === session.user.id && !shownNotificationIdsRef.current.has(notificationId)) {
                toast.info(newNotification.title, {
                  description: newNotification.message,
                  duration: 5000,
                  action: newNotification.link ? {
                    label: "View",
                    onClick: () => navigate(newNotification.link),
                  } : undefined,
                });
                
                setShownNotificationIds(prev => {
                  const newSet = new Set(prev);
                  newSet.add(notificationId);
                  return newSet;
                });
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [navigate, hasChecked]);

  const checkNotifications = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      setHasChecked(true);
      return;
    }

    const userId = session.session.user.id;
    const items: NotificationItem[] = [];

    // Check clock-in status
    await checkClockInReminder(userId, items);

    // Check unread notifications from database
    await checkDatabaseNotifications(userId, items);

    // Check pending leave requests
    await checkLeaveRequests(userId, items);

    // Check new issue assignments
    await checkIssueAssignments(userId, items);

    // Track new notifications that haven't been shown yet
    const newNotifications = items.filter(item => !shownNotificationIdsRef.current.has(item.id));
    
    // Show toast for new notifications (after initial load)
    if (hasChecked && newNotifications.length > 0) {
      newNotifications.forEach((item) => {
        toast.info(item.title, {
          description: item.message,
          duration: 5000,
          action: item.link ? {
            label: "View",
            onClick: () => {
              if (item.action) {
                item.action();
              } else if (item.link) {
                navigate(item.link);
              }
            },
          } : undefined,
        });
        setShownNotificationIds(prev => {
          const newSet = new Set(prev);
          newSet.add(item.id);
          return newSet;
        });
      });
    }

    setNotifications(items);
    
    // Don't show popup - just mark as checked
    // All notifications will show in bell icon only
    if (!hasChecked) {
      setHasChecked(true);
      
      // Mark all notifications as shown
      items.forEach((item) => {
        setShownNotificationIds(prev => {
          const newSet = new Set(prev);
          newSet.add(item.id);
          return newSet;
        });
      });
    }
  };

  const checkClockInReminder = async (userId: string, items: NotificationItem[]) => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Only check on weekdays (Monday-Friday) and during work hours (9 AM - 5 PM)
      if (currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour < 17) {
        // Check if we've already shown this reminder today (using localStorage)
        const today = new Date().toDateString();
        const lastShownDate = localStorage.getItem(`clock-in-reminder-${userId}`);
        const wasDismissedToday = lastShownDate === today;
        
        // If already shown today, skip
        if (wasDismissedToday && shownNotificationIdsRef.current.has("clock-in-reminder")) {
          return;
        }

        // Check if user has clocked in today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const { data: todayEntry, error } = await supabase
          .from("time_clock")
          .select("id, clock_in, status")
          .eq("user_id", userId)
          .gte("clock_in", todayStart.toISOString())
          .order("clock_in", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("Error checking clock-in:", error);
          return;
        }

        // If no entry today or last entry was clocked out, show reminder
        // But only if we haven't shown it today
        if ((!todayEntry || todayEntry.status === "clocked_out") && !wasDismissedToday) {
          items.push({
            id: "clock-in-reminder",
            type: "clock_in",
            title: "⏰ Time to Clock In!",
            message: "You haven't clocked in today. Don't forget to track your time!",
            action: () => {
              navigate("/time-clock");
              setOpen(false);
            },
            link: "/time-clock",
          });
        }
      }
    } catch (error) {
      console.error("Error checking clock-in reminder:", error);
    }
  };

  const checkDatabaseNotifications = async (userId: string, items: NotificationItem[]) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error loading notifications:", error);
        return;
      }

      if (data && data.length > 0) {
        data.forEach((notification) => {
          const item: NotificationItem = {
            id: notification.id,
            type: notification.type as any,
            title: notification.title,
            message: notification.message,
            link: notification.link || undefined,
          };

          // Add action based on type
          if (notification.link) {
            item.action = () => {
              navigate(notification.link!);
              setOpen(false);
            };
          }

          items.push(item);
        });
      }
    } catch (error) {
      console.error("Error checking database notifications:", error);
    }
  };

  const checkLeaveRequests = async (userId: string, items: NotificationItem[]) => {
    try {
      // Check if user has pending leave requests
      const { data: pendingLeave, error: leaveError } = await supabase
        .from("leave_requests")
        .select("id, start_date, end_date, status")
        .eq("user_id", userId)
        .eq("status", "pending")
        .limit(1)
        .maybeSingle();

      if (leaveError && leaveError.code !== 'PGRST116') {
        console.error("Error checking leave requests:", leaveError);
      } else if (pendingLeave) {
        items.push({
          id: `leave-${pendingLeave.id}`,
          type: "leave_request",
          title: "📅 Pending Leave Request",
          message: `You have a pending leave request from ${new Date(pendingLeave.start_date).toLocaleDateString()}`,
          action: () => {
            navigate("/leave-calendar");
            setOpen(false);
          },
          link: "/leave-calendar",
        });
      }

      // Check if user is admin and has pending leave requests to approve
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleData?.role === "admin") {
        const { data: pendingApprovals, error: approvalError } = await supabase
          .from("leave_requests")
          .select("id, start_date, user_id, profiles:user_id(email)")
          .eq("status", "pending")
          .limit(5);

        if (!approvalError && pendingApprovals && pendingApprovals.length > 0) {
          items.push({
            id: "leave-approvals-pending",
            type: "leave_request",
            title: "📋 Leave Requests Pending Approval",
            message: `You have ${pendingApprovals.length} leave request(s) waiting for your approval`,
            action: () => {
              navigate("/leave-calendar");
              setOpen(false);
            },
            link: "/leave-calendar",
          });
        }
      }
    } catch (error) {
      console.error("Error checking leave requests:", error);
    }
  };

  const checkIssueAssignments = async (userId: string, items: NotificationItem[]) => {
    try {
      // Check for recently assigned issues (within last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: recentAssignments, error } = await supabase
        .from("issue_assignees")
        .select("issue_id, created_at, issues:issue_id(id, title)")
        .eq("user_id", userId)
        .gte("created_at", yesterday.toISOString())
        .limit(5);

      if (error) {
        console.error("Error checking issue assignments:", error);
        return;
      }

      if (recentAssignments && recentAssignments.length > 0) {
        recentAssignments.forEach((assignment: any) => {
          if (assignment.issues) {
            items.push({
              id: `issue-${assignment.issue_id}`,
              type: "issue_assigned",
              title: "📋 New Issue Assigned",
              message: `You've been assigned to: ${assignment.issues.title}`,
              action: () => {
                navigate(`/issues/${assignment.issue_id}`);
                setOpen(false);
              },
              link: `/issues/${assignment.issue_id}`,
            });
          }
        });
      }
    } catch (error) {
      console.error("Error checking issue assignments:", error);
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (notification.action) {
      notification.action();
    } else if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "clock_in":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "leave_request":
        return <Calendar className="h-5 w-5 text-orange-500" />;
      case "issue_assigned":
        return <Bell className="h-5 w-5 text-purple-500" />;
      case "leave_approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "leave_rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Don't show popup - notifications only appear in bell icon
  return null;
}

