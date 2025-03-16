import { Metadata } from "next";
import Content from "@/app/test/Content";

export const metadata: Metadata = {
  title: "Scio.ly | Test",
  description: "Take a Science Olympiad test from tens of thousands of available questions"
}
export default function Page() {
  return <Content/>
}