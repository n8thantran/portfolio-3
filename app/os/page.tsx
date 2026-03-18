import type { Metadata } from "next";
import OperatingSystemPage from "./OperatingSystemPage";

export const metadata: Metadata = {
  title: "NathanOS",
  description: "A NathanOS desktop portfolio experience for Nathan Tran.",
};

export default function OSPage() {
  return <OperatingSystemPage />;
}
