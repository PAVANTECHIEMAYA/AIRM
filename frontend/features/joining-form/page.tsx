/**
 * New Joining Form Page
 * Comprehensive employee onboarding form with multiple sections
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  User, Briefcase, GraduationCap, Users, Heart,
  Plus, Trash2, Save, ArrowLeft, CheckCircle,
  Phone, MapPin, CreditCard, Languages, ShieldCheck
} from "lucide-react";
import * as joiningFormService from "./services/joiningFormService";
import type {
  EmployeeInfo,
  FamilyMember,
  AcademicInfo,
  PreviousEmployment,
  VerificationInfo,
  EmployerVerification
} from "./types";

// Initial empty states
const emptyEmployeeInfo: EmployeeInfo = {
  full_name: "",
  email: "",
  employee_id: "",
  date_of_birth: "",
  gender: "",
  join_date: "",
  designation: "",
  department: "",
  marital_status: "",
  phone: "",
  personal_email: "",
  bank_name: "",
  bank_ifsc: "",
  bank_branch: "",
  bank_account_number: "",
  uan_number: "",
  pf_number: "",
  current_address: "",
  permanent_address: "",
  languages_known: [],
  blood_group: "",
  height: "",
  weight: "",
  medical_history: ""
};

const emptyFamilyMember: FamilyMember = {
  member_type: "",
  member_name: "",
  contact: "",
  location: "",
  relation: ""
};

const emptyAcademicInfo: AcademicInfo = {
  qualification: "",
  specialization: "",
  institution_name: "",
  board_university: "",
  passout_year: new Date().getFullYear(),
  grade_percentage: ""
};

const emptyPreviousEmployment: PreviousEmployment = {
  employer_name: "",
  designation: "",
  duration_from: "",
  duration_to: "",
  salary: "",
  reason_for_leaving: ""
};

const emptyVerificationEmployer: EmployerVerification = {
  employer_name: "",
  designation: "",
  location: "",
  period_of_working: "",
  reason_for_leaving: "",
  supervisor_contact: "",
  hr_mail: "",
  hr_contact: ""
};

const emptyVerificationInfo: VerificationInfo = {
  name: "",
  father_name: "",
  designation: "",
  department: "",
  date_of_birth: "",
  pan_number: "",
  aadhar_number: "",
  gender: "",
  present_address: "",
  present_stay_period: "",
  present_contact: "",
  permanent_address: "",
  permanent_stay_period: "",
  permanent_contact: "",
  employers: [
    { ...emptyVerificationEmployer },
    { ...emptyVerificationEmployer },
    { ...emptyVerificationEmployer },
    { ...emptyVerificationEmployer }
  ]
};

const JoiningFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("employee");
  
  // Form state
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo>(emptyEmployeeInfo);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo[]>([]);
  const [previousEmployment, setPreviousEmployment] = useState<PreviousEmployment[]>([]);
  const [verificationInfo, setVerificationInfo] = useState<VerificationInfo>(emptyVerificationInfo);
  const [languageInput, setLanguageInput] = useState("");

  // Load existing form data if editing
  useEffect(() => {
    if (id) {
      loadFormData();
    }
  }, [id]);

  const loadFormData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const form = await joiningFormService.getJoiningFormById(id);
      if (form) {
        setEmployeeInfo(form.employee_info || emptyEmployeeInfo);
        setFamilyMembers(form.family_members || []);
        setAcademicInfo(form.academic_info || []);
        setPreviousEmployment(form.previous_employment || []);
        setVerificationInfo(form.verification_info || emptyVerificationInfo);
      }
    } catch (error) {
      console.error("Failed to load form data:", error);
      toast({ title: "Error", description: "Failed to load form data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await joiningFormService.saveJoiningForm(id, {
        employee_info: employeeInfo,
        family_members: familyMembers,
        academic_info: academicInfo,
        previous_employment: previousEmployment,
        verification_info: verificationInfo
      });
      toast({ title: "Success", description: "Form saved successfully" });
    } catch (error) {
      console.error("Failed to save form:", error);
      toast({ title: "Error", description: "Failed to save form", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await joiningFormService.saveJoiningForm(id, {
        employee_info: employeeInfo,
        family_members: familyMembers,
        academic_info: academicInfo,
        previous_employment: previousEmployment,
        verification_info: verificationInfo
      });
      await joiningFormService.completeOnboarding(id);
      toast({ title: "Success", description: "Onboarding completed successfully" });
      navigate("/joining-form");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      toast({ title: "Error", description: "Failed to complete onboarding", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Family member handlers
  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { ...emptyFamilyMember }]);
  };

  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  // Academic info handlers
  const addAcademicInfo = () => {
    setAcademicInfo([...academicInfo, { ...emptyAcademicInfo }]);
  };

  const updateAcademicInfo = (index: number, field: keyof AcademicInfo, value: string | number) => {
    const updated = [...academicInfo];
    updated[index] = { ...updated[index], [field]: value };
    setAcademicInfo(updated);
  };

  const removeAcademicInfo = (index: number) => {
    setAcademicInfo(academicInfo.filter((_, i) => i !== index));
  };

  // Previous employment handlers
  const addPreviousEmployment = () => {
    setPreviousEmployment([...previousEmployment, { ...emptyPreviousEmployment }]);
  };

  const updatePreviousEmployment = (index: number, field: keyof PreviousEmployment, value: string) => {
    const updated = [...previousEmployment];
    updated[index] = { ...updated[index], [field]: value };
    setPreviousEmployment(updated);
  };

  const removePreviousEmployment = (index: number) => {
    setPreviousEmployment(previousEmployment.filter((_, i) => i !== index));
  };

  // Verification handlers
  const updateVerificationField = (field: keyof VerificationInfo, value: string) => {
    setVerificationInfo({ ...verificationInfo, [field]: value });
  };

  const updateVerificationEmployer = (
    index: number,
    field: keyof EmployerVerification,
    value: string
  ) => {
    const employers = [...verificationInfo.employers];
    employers[index] = { ...employers[index], [field]: value };
    setVerificationInfo({ ...verificationInfo, employers });
  };

  // Language handlers
  const addLanguage = () => {
    if (languageInput.trim() && !employeeInfo.languages_known.includes(languageInput.trim())) {
      setEmployeeInfo({
        ...employeeInfo,
        languages_known: [...employeeInfo.languages_known, languageInput.trim()]
      });
      setLanguageInput("");
    }
  };

  const removeLanguage = (lang: string) => {
    setEmployeeInfo({
      ...employeeInfo,
      languages_known: employeeInfo.languages_known.filter(l => l !== lang)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 bg-gray-50">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/joining-form")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">New Joining Form</h1>
                <p className="text-gray-500">Complete employee onboarding information</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleComplete} disabled={saving}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Onboarding
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 border-b">
            <button
              onClick={() => setActiveTab("employee")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === "employee"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Basic Info</span>
            </button>
            <button
              onClick={() => setActiveTab("family")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === "family"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Family</span>
            </button>
            <button
              onClick={() => setActiveTab("academic")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === "academic"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Education</span>
            </button>
            <button
              onClick={() => setActiveTab("employment")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === "employment"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Experience</span>
            </button>
            <button
              onClick={() => setActiveTab("health")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === "health"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Heart className="h-4 w-4" />
              <span>Health</span>
            </button>
            <button
              onClick={() => setActiveTab("verification")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === "verification"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Verification</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="hidden">
            <TabsTrigger value="employee" className="hidden">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Employee Info</span>
            </TabsTrigger>
            <TabsTrigger value="family" className="hidden">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Family</span>
            </TabsTrigger>
            <TabsTrigger value="academic" className="hidden">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Academic</span>
            </TabsTrigger>
            <TabsTrigger value="employment" className="hidden">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Experience</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="hidden">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="hidden">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Verification</span>
            </TabsTrigger>
          </TabsList>

        {/* Employee Information Tab */}
        <TabsContent value="employee" className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={employeeInfo.full_name}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label>Employee Code *</Label>
                <Input
                  value={employeeInfo.employee_id}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, employee_id: e.target.value })}
                  placeholder="Enter employee code"
                />
              </div>
              <div>
                <Label>Date of Birth *</Label>
                <Input
                  type="date"
                  value={employeeInfo.date_of_birth}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <Label>Gender *</Label>
                <Select
                  value={employeeInfo.gender}
                  onValueChange={(value: string) => setEmployeeInfo({ ...employeeInfo, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Joining Date *</Label>
                <Input
                  type="date"
                  value={employeeInfo.join_date}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, join_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Designation *</Label>
                <Input
                  value={employeeInfo.designation}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, designation: e.target.value })}
                  placeholder="Enter designation"
                />
              </div>
              <div>
                <Label>Department *</Label>
                <Input
                  value={employeeInfo.department}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, department: e.target.value })}
                  placeholder="Enter department"
                />
              </div>
              <div>
                <Label>Marital Status</Label>
                <Select
                  value={employeeInfo.marital_status}
                  onValueChange={(value: string) => setEmployeeInfo({ ...employeeInfo, marital_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Mobile Number *</Label>
                <Input
                  value={employeeInfo.phone}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, phone: e.target.value })}
                  placeholder="Enter mobile number"
                />
              </div>
              <div>
                <Label>Official Email *</Label>
                <Input
                  type="email"
                  value={employeeInfo.email}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, email: e.target.value })}
                  placeholder="Enter official email"
                />
              </div>
              <div>
                <Label>Personal Email</Label>
                <Input
                  type="email"
                  value={employeeInfo.personal_email}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, personal_email: e.target.value })}
                  placeholder="Enter personal email"
                />
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Bank & PF Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={employeeInfo.bank_name}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, bank_name: e.target.value })}
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <Label>IFSC Code</Label>
                <Input
                  value={employeeInfo.bank_ifsc}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, bank_ifsc: e.target.value })}
                  placeholder="Enter IFSC code"
                />
              </div>
              <div>
                <Label>Branch</Label>
                <Input
                  value={employeeInfo.bank_branch}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, bank_branch: e.target.value })}
                  placeholder="Enter branch name"
                />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input
                  value={employeeInfo.bank_account_number}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, bank_account_number: e.target.value })}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <Label>UAN Number</Label>
                <Input
                  value={employeeInfo.uan_number}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, uan_number: e.target.value })}
                  placeholder="Enter UAN number"
                />
              </div>
              <div>
                <Label>PF Number</Label>
                <Input
                  value={employeeInfo.pf_number}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, pf_number: e.target.value })}
                  placeholder="Enter PF number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Current Address</Label>
                <Textarea
                  value={employeeInfo.current_address}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, current_address: e.target.value })}
                  placeholder="Enter current address"
                  rows={3}
                />
              </div>
              <div>
                <Label>Permanent Address</Label>
                <Textarea
                  value={employeeInfo.permanent_address}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, permanent_address: e.target.value })}
                  placeholder="Enter permanent address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Languages Known
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  placeholder="Enter language"
                  onKeyPress={(e) => e.key === "Enter" && addLanguage()}
                />
                <Button type="button" onClick={addLanguage}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {employeeInfo.languages_known.map((lang, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {lang}
                    <button onClick={() => removeLanguage(lang)} className="hover:text-red-600">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Family Information Tab */}
        <TabsContent value="family" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Family Members
              </CardTitle>
              <Button onClick={addFamilyMember}>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {familyMembers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No family members added. Click "Add Member" to add.</p>
              ) : (
                familyMembers.map((member, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Family Member #{index + 1}</h4>
                      <Button variant="ghost" size="icon" onClick={() => removeFamilyMember(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label>Member Type *</Label>
                        <Select
                          value={member.member_type}
                          onValueChange={(value: string) => updateFamilyMember(index, "member_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Father">Father</SelectItem>
                            <SelectItem value="Mother">Mother</SelectItem>
                            <SelectItem value="Spouse">Spouse</SelectItem>
                            <SelectItem value="Child">Child</SelectItem>
                            <SelectItem value="Sibling">Sibling</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Name *</Label>
                        <Input
                          value={member.member_name}
                          onChange={(e) => updateFamilyMember(index, "member_name", e.target.value)}
                          placeholder="Enter name"
                        />
                      </div>
                      <div>
                        <Label>Contact</Label>
                        <Input
                          value={member.contact}
                          onChange={(e) => updateFamilyMember(index, "contact", e.target.value)}
                          placeholder="Enter contact number"
                        />
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Input
                          value={member.location}
                          onChange={(e) => updateFamilyMember(index, "location", e.target.value)}
                          placeholder="Enter location"
                        />
                      </div>
                      <div>
                        <Label>Relation</Label>
                        <Input
                          value={member.relation}
                          onChange={(e) => updateFamilyMember(index, "relation", e.target.value)}
                          placeholder="Enter relation"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Information Tab */}
        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Qualifications
              </CardTitle>
              <Button onClick={addAcademicInfo}>
                <Plus className="h-4 w-4 mr-2" />
                Add Qualification
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {academicInfo.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No qualifications added. Click "Add Qualification" to add.</p>
              ) : (
                academicInfo.map((academic, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Qualification #{index + 1}</h4>
                      <Button variant="ghost" size="icon" onClick={() => removeAcademicInfo(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label>Qualification *</Label>
                        <Input
                          value={academic.qualification}
                          onChange={(e) => updateAcademicInfo(index, "qualification", e.target.value)}
                          placeholder="e.g., B.Tech, MBA, 12th"
                        />
                      </div>
                      <div>
                        <Label>Specialization</Label>
                        <Input
                          value={academic.specialization}
                          onChange={(e) => updateAcademicInfo(index, "specialization", e.target.value)}
                          placeholder="e.g., Computer Science"
                        />
                      </div>
                      <div>
                        <Label>College/School Name *</Label>
                        <Input
                          value={academic.institution_name}
                          onChange={(e) => updateAcademicInfo(index, "institution_name", e.target.value)}
                          placeholder="Enter institution name"
                        />
                      </div>
                      <div>
                        <Label>Board/University *</Label>
                        <Input
                          value={academic.board_university}
                          onChange={(e) => updateAcademicInfo(index, "board_university", e.target.value)}
                          placeholder="Enter board/university"
                        />
                      </div>
                      <div>
                        <Label>Passout Year *</Label>
                        <Input
                          type="number"
                          value={academic.passout_year}
                          onChange={(e) => updateAcademicInfo(index, "passout_year", parseInt(e.target.value))}
                          placeholder="Enter year"
                        />
                      </div>
                      <div>
                        <Label>Grade/Percentage *</Label>
                        <Input
                          value={academic.grade_percentage}
                          onChange={(e) => updateAcademicInfo(index, "grade_percentage", e.target.value)}
                          placeholder="e.g., 85% or 8.5 CGPA"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Previous Employment Tab */}
        <TabsContent value="employment" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Previous Employment
              </CardTitle>
              <Button onClick={addPreviousEmployment}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employment
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {previousEmployment.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No previous employment added. Click "Add Employment" to add.</p>
              ) : (
                previousEmployment.map((employment, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Employment #{index + 1}</h4>
                      <Button variant="ghost" size="icon" onClick={() => removePreviousEmployment(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label>Employer Name *</Label>
                        <Input
                          value={employment.employer_name}
                          onChange={(e) => updatePreviousEmployment(index, "employer_name", e.target.value)}
                          placeholder="Enter employer name"
                        />
                      </div>
                      <div>
                        <Label>Designation *</Label>
                        <Input
                          value={employment.designation}
                          onChange={(e) => updatePreviousEmployment(index, "designation", e.target.value)}
                          placeholder="Enter designation"
                        />
                      </div>
                      <div>
                        <Label>Duration From *</Label>
                        <Input
                          type="date"
                          value={employment.duration_from}
                          onChange={(e) => updatePreviousEmployment(index, "duration_from", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Duration To *</Label>
                        <Input
                          type="date"
                          value={employment.duration_to}
                          onChange={(e) => updatePreviousEmployment(index, "duration_to", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Salary</Label>
                        <Input
                          value={employment.salary}
                          onChange={(e) => updatePreviousEmployment(index, "salary", e.target.value)}
                          placeholder="Enter salary"
                        />
                      </div>
                      <div>
                        <Label>Reason for Leaving</Label>
                        <Input
                          value={employment.reason_for_leaving}
                          onChange={(e) => updatePreviousEmployment(index, "reason_for_leaving", e.target.value)}
                          placeholder="Enter reason"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Information Tab */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Health Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Blood Group</Label>
                <Select
                  value={employeeInfo.blood_group}
                  onValueChange={(value: string) => setEmployeeInfo({ ...employeeInfo, blood_group: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Height (cm)</Label>
                <Input
                  value={employeeInfo.height}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, height: e.target.value })}
                  placeholder="Enter height in cm"
                />
              </div>
              <div>
                <Label>Weight (kg)</Label>
                <Input
                  value={employeeInfo.weight}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, weight: e.target.value })}
                  placeholder="Enter weight in kg"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Label>Any Major Surgery/Illness in Past</Label>
                <Textarea
                  value={employeeInfo.medical_history}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, medical_history: e.target.value })}
                  placeholder="Describe any major surgeries or illnesses"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Employee Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={verificationInfo.name}
                  onChange={(e) => updateVerificationField("name", e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label>Father Name *</Label>
                <Input
                  value={verificationInfo.father_name}
                  onChange={(e) => updateVerificationField("father_name", e.target.value)}
                  placeholder="Enter father name"
                />
              </div>
              <div>
                <Label>Designation *</Label>
                <Input
                  value={verificationInfo.designation}
                  onChange={(e) => updateVerificationField("designation", e.target.value)}
                  placeholder="Enter designation"
                />
              </div>
              <div>
                <Label>Department *</Label>
                <Input
                  value={verificationInfo.department}
                  onChange={(e) => updateVerificationField("department", e.target.value)}
                  placeholder="Enter department"
                />
              </div>
              <div>
                <Label>Date of Birth *</Label>
                <Input
                  type="date"
                  value={verificationInfo.date_of_birth}
                  onChange={(e) => updateVerificationField("date_of_birth", e.target.value)}
                />
              </div>
              <div>
                <Label>PAN Number *</Label>
                <Input
                  value={verificationInfo.pan_number}
                  onChange={(e) => updateVerificationField("pan_number", e.target.value)}
                  placeholder="Enter PAN number"
                />
              </div>
              <div>
                <Label>Aadhar Number *</Label>
                <Input
                  value={verificationInfo.aadhar_number}
                  onChange={(e) => updateVerificationField("aadhar_number", e.target.value)}
                  placeholder="Enter Aadhar number"
                />
              </div>
              <div>
                <Label>Gender *</Label>
                <Input
                  value={verificationInfo.gender}
                  onChange={(e) => updateVerificationField("gender", e.target.value)}
                  placeholder="Enter gender"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address for Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Present Address *</Label>
                <Textarea
                  value={verificationInfo.present_address}
                  onChange={(e) => updateVerificationField("present_address", e.target.value)}
                  placeholder="Enter present address"
                  rows={3}
                />
                <Input
                  value={verificationInfo.present_stay_period}
                  onChange={(e) => updateVerificationField("present_stay_period", e.target.value)}
                  placeholder="Period of stay"
                />
                <Input
                  value={verificationInfo.present_contact}
                  onChange={(e) => updateVerificationField("present_contact", e.target.value)}
                  placeholder="Contact (residence)"
                />
              </div>
              <div className="space-y-2">
                <Label>Permanent Address *</Label>
                <Textarea
                  value={verificationInfo.permanent_address}
                  onChange={(e) => updateVerificationField("permanent_address", e.target.value)}
                  placeholder="Enter permanent address"
                  rows={3}
                />
                <Input
                  value={verificationInfo.permanent_stay_period}
                  onChange={(e) => updateVerificationField("permanent_stay_period", e.target.value)}
                  placeholder="Period of stay"
                />
                <Input
                  value={verificationInfo.permanent_contact}
                  onChange={(e) => updateVerificationField("permanent_contact", e.target.value)}
                  placeholder="Contact (residence)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Employment Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {verificationInfo.employers.map((employer, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Employer {index + 1}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Employer Name *</Label>
                      <Input
                        value={employer.employer_name}
                        onChange={(e) => updateVerificationEmployer(index, "employer_name", e.target.value)}
                        placeholder="Enter employer name"
                      />
                    </div>
                    <div>
                      <Label>Designation *</Label>
                      <Input
                        value={employer.designation}
                        onChange={(e) => updateVerificationEmployer(index, "designation", e.target.value)}
                        placeholder="Enter designation"
                      />
                    </div>
                    <div>
                      <Label>Location *</Label>
                      <Input
                        value={employer.location}
                        onChange={(e) => updateVerificationEmployer(index, "location", e.target.value)}
                        placeholder="Enter location"
                      />
                    </div>
                    <div>
                      <Label>Period of Working *</Label>
                      <Input
                        value={employer.period_of_working}
                        onChange={(e) => updateVerificationEmployer(index, "period_of_working", e.target.value)}
                        placeholder="e.g. Jan 2021 - Mar 2023"
                      />
                    </div>
                    <div>
                      <Label>Reason of Leaving *</Label>
                      <Input
                        value={employer.reason_for_leaving}
                        onChange={(e) => updateVerificationEmployer(index, "reason_for_leaving", e.target.value)}
                        placeholder="Enter reason"
                      />
                    </div>
                    <div>
                      <Label>Supervisor Contact *</Label>
                      <Input
                        value={employer.supervisor_contact}
                        onChange={(e) => updateVerificationEmployer(index, "supervisor_contact", e.target.value)}
                        placeholder="Enter supervisor contact"
                      />
                    </div>
                    <div>
                      <Label>HR Mail ID *</Label>
                      <Input
                        value={employer.hr_mail}
                        onChange={(e) => updateVerificationEmployer(index, "hr_mail", e.target.value)}
                        placeholder="Enter HR email"
                      />
                    </div>
                    <div>
                      <Label>HR Contact *</Label>
                      <Input
                        value={employer.hr_contact}
                        onChange={(e) => updateVerificationEmployer(index, "hr_contact", e.target.value)}
                        placeholder="Enter HR contact"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default JoiningFormPage;
