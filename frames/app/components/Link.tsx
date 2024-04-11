import Link from "next/link";

export default function StyledLink(props: {
  children: React.ReactNode;
  url: string;
}) {
  return (
    <Link
      href={props.url}
      style={{ textDecoration: "underline" }}
      target="_blank"
    >
      {props.children}
    </Link>
  );
}
