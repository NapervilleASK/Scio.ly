import { Metadata } from "next";
import Content from "@/app/unlimited/Content";

export const metadata: Metadata = {
  title: "Scio.ly | Unlimited",
  description: "Unlimited Science Olympiad practice from tens of thousands of available questions"
}
export default function Page() {
  return <Content/>
}