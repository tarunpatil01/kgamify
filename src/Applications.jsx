import React from "react";


const Applications = () => {
  const applicants = [
    { name: "Jane Smith", resume: "📄", testScore: "92%", skills: ["Python", "Java"] },
    { name: "Robert Johnson", resume: "📄", testScore: "88%", skills: ["C++", "Python"] },
    { name: "Samantha Williams", resume: "📄", testScore: "94%", skills: ["Java", "C++"] },
    { name: "Michael Davis", resume: "📄", testScore: "90%", skills: ["Python", "Java"] },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <div className="text-3xl font-bold mb-4 text-[#C30E59]">Software Engineer</div>
        <div className="text-gray-700 mb-6">
          <div><strong>Location:</strong> San Francisco, CA</div>
          <div><strong>Seniority Level:</strong> Entry-level</div>
          <div><strong>Company Size:</strong> 11-50 employees</div>
          <div><strong>Employment Type:</strong> Full-time</div>
          <div><strong>Remote Work Available:</strong> Yes</div>
          <div><strong>Industry:</strong> Computer Software</div>
        </div>
        
        <div className="text-xl font-semibold mb-4 text-[#E82561]">Applicants</div>
        <table className="w-full border-collapse border border-gray-200 shadow-lg">
          <thead>
            <tr className="bg-[#F2AE66]">
              <th className="border border-gray-300 p-4 text-left">Name</th>
              <th className="border border-gray-300 p-4 text-left">Resume</th>
              <th className="border border-gray-300 p-4 text-left">Test Score</th>
              <th className="border border-gray-300 p-4 text-left">Skills</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant, index) => (
              <tr key={index} className="bg-white hover:bg-gray-50 transition duration-300">
                <td className="border border-gray-300 p-4">{applicant.name}</td>
                <td className="border border-gray-300 p-4">{applicant.resume}</td>
                <td className="border border-gray-300 p-4">{applicant.testScore}</td>
                <td className="border border-gray-300 p-4">{applicant.skills.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Applications;