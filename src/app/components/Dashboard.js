
export default function Dashboard() {
  const stats = [
    { title: "Total Users", value: "50"  },
    { title: "Admin Users", value: "2" },
    { title: "Other Users", value: "48" },
    { title: "Active Users", value: "35" },
  ];

  return (
    <div className="p-8 w-full">
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition"
          >
            <h2 className="text-gray-500 font-medium">{stat.title}</h2>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{stat.value}</p>
            <span className="text-sm text-green-500">{stat.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
