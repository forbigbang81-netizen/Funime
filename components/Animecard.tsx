type Props = {
  title: string;
  image: string;
};

export default function AnimeCard({
  title,
  image,
}: Props) {
  return (
    <div className="w-48">
      <img
        src={image}
        alt={title}
        className="rounded-xl"
      />

      <h3 className="mt-3 text-sm">
        {title}
      </h3>
    </div>
  );
}