import React from "react";
import { useParams } from "react-router-dom";
import { FaFileAlt, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const Job = () => {
  const { jobId } = useParams();
  const jobDetails = {
    1: {
      title: "Senior Software Engineer",
      category: "Full Time",
      openings: 12,
      applications: 135,
      status: "Active",
      description: "Design user interfaces and user experiences.",
      salary: "₹150K - ₹220K",
      location: "Bengaluru - In Office",
      type: "Engineering",
      applicants: [
        {
          name: "Jane Smith",
          resume: "",
          testScore: "92%",
          skills: ["Python", "Java"],
        },
        {
          name: "Robert Johnson",
          resume: "",
          testScore: "88%",
          skills: ["C++", "Python"],
        },
      ],
    },
    2: {
      title: "Machine Learning Engineer",
      category: "Full Time",
      openings: 8,
      applications: 100,
      status: "Inactive",
      description: "Develop both frontend and backend of web applications.",
      salary: "₹160K - ₹220K",
      location: "Remote",
      type: "Engineering",
      applicants: [
        {
          name: "Samantha Williams",
          resume: "",
          testScore: "94%",
          skills: ["Java", "C++"],
        },
        {
          name: "Michael Davis",
          resume: "",
          testScore: "90%",
          skills: ["Python", "Java"],
        },
      ],
    },
    3: {
      title: "Data Scientist",
      category: "Internship",
      openings: 12,
      applications: 5,
      status: "Active",
      description:
        "Manage and automate infrastructure and deployment processes.",
      salary: "₹140K - ₹180K",
      location: "Bengaluru - In Office",
      type: "Data",
      applicants: [
        {
          name: "Alice Brown",
          resume:"",
          testScore: "85%",
          skills: ["AWS", "Docker"],
        },
        {
          name: "John Doe",
          resume:"",
          testScore: "89%",
          skills: ["Kubernetes", "Terraform"],
        },
      ],
    },
    4: {
      title: "UX Designer",
      category: "Full Time",
      openings: 4,
      applications: 45,
      status: "Active",
      description: "Develop and maintain Android applications.",
      salary: "$120K - $160K",
      location: "Remote",
      type: "Design",
      applicants: [
        {
          name: "Emily Clark",
          resume: "",
          testScore: "91%",
          skills: ["Kotlin", "Java"],
        },
        {
          name: "David Wilson",
          resume: "",
          testScore: "87%",
          skills: ["Android SDK", "React Native"],
        },
      ],
    },
    5: {
      title: "Product Manager",
      category: "Full Time",
      openings: 18,
      applications: 96,
      status: "Inactive",
      description: "Develop and maintain iOS applications.",
      salary: "$130K - $170K",
      location: "Chennai - In Office",
      type: "Product",
      applicants: [
        {
          name: "Sophia Martinez",
          resume: "",
          testScore: "93%",
          skills: ["Swift", "Objective-C"],
        },
        {
          name: "James Anderson",
          resume: "",
          testScore: "89%",
          skills: ["iOS SDK", "Flutter"],
        },
      ],
    },
    6: {
      title: "Site Reliability Engineer",
      category: "Full Time",
      openings: 12,
      applications: 90,
      status: "Active",
      description: "Develop and maintain iOS applications.",
      salary: "$140K - $190K",
      location: "Remote",
      type: "Engineering",
      applicants: [
        {
          name: "Olivia White",
          resume: "",
          testScore: "92%",
          skills: ["Python", "Java"],
        },
        {
          name: "William Harris",
          resume: "",
          testScore: "88%",
          skills: ["C++", "Python"],
        },
      ],
    },
    7: {
      title: "Technical Writer",
      category: "Full Time",
      openings: 4,
      applications: 45,
      status: "Active",
      description: "Develop and maintain Android applications.",
      salary: "$100K - $140K",
      location: "Bengaluru - In Office",
      type: "Product",
      applicants: [
        {
          name: "Sophia Martinez",
          resume: "",
          testScore: "93%",
          skills: ["Swift", "Objective-C"],
        },
        {
          name: "James Anderson",
          resume: "",
          testScore: "89%",
          skills: ["iOS SDK", "Flutter"],
        },
      ],
    },
    8: {
      title: "Security Engineer",
      category: "Full Time",
      openings: 18,
      applications: 96,
      status: "Inactive",
      description: "Develop and maintain iOS applications.",
      salary: "$130K - $170K",
      location: "Chennai - In Office",
      type: "Product",
      applicants: [
        {
          name: "Olivia White",
          resume: "",
          testScore: "92%",
          skills: ["Python", "Java"],
        },
        {
          name: "William Harris",
          resume: "",
          testScore: "88%",
          skills: ["C++", "Python"],
        },
      ],
    },
  };

  const job = jobDetails[jobId];

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <div className="bg-[#F6C794] p-5 rounded-lg shadow-md">
          <div className="text-3xl font-bold mb-4 text-[#C30E59]">
            {job.title}
          </div>
          <div className="text-gray-700 mb-6">
            <div>
              <strong>Category:</strong> {job.category}
            </div>
            <div>
              <strong>Openings:</strong> {job.openings}
            </div>
            <div>
              <strong>Applications:</strong> {job.applications}
            </div>
            <div>
              <strong>Status:</strong>{" "}
              {job.status === "Active" ? (
                <FaCheckCircle className="inline text-green-500" />
              ) : (
                <FaTimesCircle className="inline text-red-500" />
              )}
            </div>
            <div>
              <strong>Description:</strong> {job.description}
            </div>
            <div>
              <strong>Salary:</strong> {job.salary}
            </div>
            <div>
              <strong>Location:</strong> {job.location}
            </div>
            <div>
              <strong>Type:</strong> {job.type}
            </div>
          </div>
        </div>

        <div className="text-xl font-semibold mb-4 text-[#E82561] mt-6">
          Applicants
        </div>
        <table className="w-full border-collapse border border-gray-200 shadow-lg rounded-lg">
          <thead>
            <tr className="bg-[#F2AE66] rounded-t-lg">
              <th className="border border-gray-300 p-4 text-left rounded-tl-lg">
                Name
              </th>
              <th className="border border-gray-300 p-4 text-left">Resume</th>
              <th className="border border-gray-300 p-4 text-left">
                Test Score
              </th>
              <th className="border border-gray-300 p-4 text-left rounded-tr-lg">
                Skills
              </th>
            </tr>
          </thead>
          <tbody>
            {job.applicants.map((applicant, index) => (
              <tr
                key={index}
                className={`bg-white hover:bg-gray-50 transition duration-300 ${
                  index === job.applicants.length - 1 ? "rounded-b-lg" : ""
                }`}
              >
                <td className="border border-gray-300 p-4">{applicant.name}</td>
                <td className="border border-gray-300 p-4">
                  <FaFileAlt className="inline mr-2" />
                  {applicant.resume}
                </td>
                <td className="border border-gray-300 p-4">
                  {applicant.testScore}
                </td>
                <td className="border border-gray-300 p-4">
                  {applicant.skills.join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Job;