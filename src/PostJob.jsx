import { useState } from "react";
import { Button, Input, Textarea, Select, Card, CardContent } from "@/components/ui";

export default function JobPostingForm() {
  const [formData, setFormData] = useState({
    jobTitle: "",
    jobDescription: "",
    employmentType: "",
    experienceLevel: "",
    remoteOrOnsite: "",
    location: "",
    salary: "",
    equity: "",
    sponsorship: "",
    recruitmentProcess: "",
    responsibilities: "",
    skills: "",
    benefits: "",
    eligibility: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold">Create a Job Post</h2>
      <p className="text-sm text-gray-600">Fill in the details below to create your job post.</p>
      
      <Card className="mt-4 p-4">
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Input name="jobTitle" placeholder="Job Title" value={formData.jobTitle} onChange={handleChange} />
            <Input name="salary" placeholder="Salary Range (USD)" value={formData.salary} onChange={handleChange} />
            <Textarea name="jobDescription" placeholder="Job Description" value={formData.jobDescription} onChange={handleChange} />
            <Textarea name="responsibilities" placeholder="Responsibilities" value={formData.responsibilities} onChange={handleChange} />
            <Textarea name="skills" placeholder="Skills" value={formData.skills} onChange={handleChange} />
            <Textarea name="benefits" placeholder="Benefits" value={formData.benefits} onChange={handleChange} />
            <Select name="employmentType" value={formData.employmentType} onChange={handleChange}>
              <option value="">Employment Type</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
            </Select>
            <Select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange}>
              <option value="">Experience Level</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-Level</option>
              <option value="senior">Senior</option>
            </Select>
            <Select name="remoteOrOnsite" value={formData.remoteOrOnsite} onChange={handleChange}>
              <option value="">Remote or Onsite</option>
              <option value="remote">Remote</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
            </Select>
            <Input name="location" placeholder="Location (City, State, Country)" value={formData.location} onChange={handleChange} />
            <Input name="equity" placeholder="Equity" value={formData.equity} onChange={handleChange} />
            <Input name="sponsorship" placeholder="Sponsorship" value={formData.sponsorship} onChange={handleChange} />
            <Textarea name="recruitmentProcess" placeholder="Recruitment Process" value={formData.recruitmentProcess} onChange={handleChange} />
            <Textarea name="eligibility" placeholder="Eligibility" value={formData.eligibility} onChange={handleChange} />
          </div>
          <div className="flex justify-end mt-4">
            <Button className="bg-pink-500 text-white px-4 py-2 rounded-lg">Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}