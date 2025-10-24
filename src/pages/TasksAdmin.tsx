import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Check, LogOut, UserPlus, X } from "lucide-react";
import { User } from "@supabase/supabase-js";
const logo = "/techiemaya-logo.png";

interface Task {
  id: string;
  title: string;
  description?: string;
  project_name?: string;
  status: string;
  user_id: string;
}

interface UserProfile {
  id: string;
  email: string;
}

interface TaskAssignment {
  task_id: string;
  user_id: string;
  user_email: string;
}

const TasksAdmin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskProjectName, setNewTaskProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [assigningTask, setAssigningTask] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        checkAdminStatus(session.user.id);
        loadTasks();
        loadUsers();
        loadAssignments();
      }
    });
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data?.role === "admin");
    } catch (err) {
      console.error("Error in checkAdminStatus:", err);
      setIsAdmin(false);
    }
  };

  const loadTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    setTasks(data || []);
  };

  const loadUsers = async () => {
    try {
      // Use the database function to get all users
      const { data, error } = await supabase.rpc("get_all_users_with_roles");

      if (error) {
        console.error("Error loading users:", error);
        return;
      }

      if (data) {
        const userProfiles = data.map((u: any) => ({
          id: u.user_id,
          email: u.email,
        }));
        setUsers(userProfiles);
      }
    } catch (err) {
      console.error("Error in loadUsers:", err);
    }
  };

  const loadAssignments = async () => {
    try {
      const { data } = await supabase
        .from("task_assignments")
        .select("task_id, user_id");

      if (data) {
        // Get user emails from our database function
        const { data: allUsers } = await supabase.rpc("get_all_users_with_roles");
        
        const assignmentsWithEmails = data.map((a) => {
          const user = allUsers?.find((u: any) => u.user_id === a.user_id);
          return {
            task_id: a.task_id,
            user_id: a.user_id,
            user_email: user?.email || "Unknown",
          };
        });
        setAssignments(assignmentsWithEmails);
      }
    } catch (err) {
      console.error("Error in loadAssignments:", err);
    }
  };

  const addTask = async () => {
    if (!user || !newTaskTitle.trim() || !newTaskProjectName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: newTaskTitle,
        description: newTaskDescription || null,
        project_name: newTaskProjectName,
        status: "active",
      });

      if (error) throw error;

      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskProjectName("");
      toast({
        title: "Task Created",
        description: "New task has been created successfully",
      });
      loadTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;

      toast({
        title: "Task Deleted",
        description: "Task has been deleted successfully",
      });
      loadTasks();
      loadAssignments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async (taskId: string, userId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("task_assignments").insert({
        task_id: taskId,
        user_id: userId,
        assigned_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Task Assigned",
        description: "Task has been assigned to user",
      });
      loadAssignments();
      setAssigningTask(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unassignTask = async (taskId: string, userId: string) => {
    setLoading(true);
    try {
      const { error} = await supabase
        .from("task_assignments")
        .delete()
        .eq("task_id", taskId)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Assignment Removed",
        description: "Task assignment has been removed",
      });
      loadAssignments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove assignment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTaskAssignees = (taskId: string) => {
    return assignments.filter((a) => a.task_id === taskId);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error (ignoring):", error);
    } finally {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error("Storage clear error:", e);
      }
      window.location.replace("/auth");
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Access Denied. Admin privileges required.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-40 w-auto" />
            <h1 className="text-2xl font-bold">Task Management</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Timesheet
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/users"}>
              Users
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/monitoring"}>
              Monitoring
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/time-clock"}>
              Time Clock
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Create Task */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Task title (e.g., 'facebook', 'twitter')"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTask()}
                />
              </div>
              <div>
                <Input
                  placeholder="Project name (required)"
                  value={newTaskProjectName}
                  onChange={(e) => setNewTaskProjectName(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Task description (optional)"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />
              </div>
              <Button onClick={addTask} disabled={loading || !newTaskTitle.trim() || !newTaskProjectName.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No tasks yet. Create your first task above.
              </p>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => {
                  const assignees = getTaskAssignees(task.id);
                  return (
                    <div key={task.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <h3 className="font-semibold">{task.title}</h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                task.status === "active"
                                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteTask(task.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Assigned Users */}
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Assigned to:</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setAssigningTask(assigningTask === task.id ? null : task.id)
                            }
                          >
                            <UserPlus className="mr-2 h-3 w-3" />
                            Assign
                          </Button>
                        </div>

                        {assignees.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Not assigned to anyone</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {assignees.map((assignee) => (
                              <div
                                key={assignee.user_id}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                              >
                                {assignee.user_email}
                                <button
                                  onClick={() => unassignTask(task.id, assignee.user_id)}
                                  className="ml-1 hover:text-red-600"
                                  disabled={loading}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Assign User Dropdown */}
                        {assigningTask === task.id && (
                          <div className="mt-2 p-2 border rounded-md bg-muted/50">
                            <p className="text-xs font-medium mb-2">Select user to assign:</p>
                            <div className="space-y-1">
                              {users
                                .filter(
                                  (u) => !assignees.some((a) => a.user_id === u.id)
                                )
                                .map((u) => (
                                  <button
                                    key={u.id}
                                    onClick={() => assignTask(task.id, u.id)}
                                    className="w-full text-left text-xs px-2 py-1 rounded hover:bg-background"
                                    disabled={loading}
                                  >
                                    {u.email}
                                  </button>
                                ))}
                              {users.filter((u) => !assignees.some((a) => a.user_id === u.id))
                                .length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                  All users assigned
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TasksAdmin;

