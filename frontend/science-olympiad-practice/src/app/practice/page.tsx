import { Metadata } from "next";
import Content from "@/app/practice/Content";

export const metadata: Metadata = {
  title: "Scio.ly | Practice",
  description: "Practice your skills with tens of thousands of real Science Olympiad questions"
}
export default function Page() {
  return <Content/>
}