export default function HeroBanner() {
  return (
    <div className="relative h-[500px] w-full">
      <img
        src="/banners/solo-leveling.jpg"
        alt="Solo Leveling"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#080510] to-transparent" />

      <div className="absolute bottom-10 left-10">
        <h1 className="text-6xl font-bold">
          Solo Leveling
        </h1>

        <p className="mt-4 text-gray-300">
          New Episode Available
        </p>

        <button className="mt-6 rounded-xl bg-purple-600 px-8 py-3">
          Watch Now
        </button>
      </div>
    </div>
  );
}