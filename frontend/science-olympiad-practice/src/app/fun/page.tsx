import { Metadata } from "next";
import Content from "@/app/fun/GamesDashboard";

export const metadata: Metadata = {
  title: "Scio.ly | Dashboard",
  description: "Track your Scioly test-taking performance across several statistics"
}
export default function Page() {
  return <Content/>
}