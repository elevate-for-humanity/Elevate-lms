interface StatStripProps {
  stats: Array<{
    value: string;
    label: string;
    color?: "blue" | "green" | "orange" | "purple";
  }>;
  background?: "white" | "slate" | "dark";
}

export function StatStrip({ stats, background = "slate" }: StatStripProps) {
  const bgClass =
    background === "white" ? "bg-white" :
    background === "slate" ? "bg-slate-50" :
    "bg-slate-900 text-white";

  const getColorClass = (color?: string) => {
    switch (color) {
      case "blue": return "text-brand-blue-600";
      case "green": return "text-green-600";
      case "orange": return "text-orange-600";
      case "purple": return "text-purple-600";
      default: return background === "dark" ? "text-orange-400" : "text-brand-blue-600";
    }
  };

  return (
    <section className={`${bgClass} border-y border-slate-200 py-12`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className={`text-4xl md:text-5xl font-bold mb-2 ${getColorClass(stat.color)}`}>
                {stat.value}
              </div>
              <p className={`text-sm ${background === "dark" ? "text-slate-300" : "text-black"}`}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
