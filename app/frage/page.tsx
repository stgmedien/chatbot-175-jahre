import ChatBox from "@/components/ChatBox";

export default function FragePage() {
  return (
    <div className="flex flex-col gap-3 py-2">
      <h1 className="text-xl font-semibold tracking-tight text-esg-primary">Frag den Erzählbot</h1>
      <ChatBox />
    </div>
  );
}
