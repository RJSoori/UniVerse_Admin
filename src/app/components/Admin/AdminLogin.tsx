import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Lock } from "lucide-react";

interface AdminLoginProps {
  onLogin: (email: string, pass: string) => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    // Validation can be added here before passing to the parent
    if (email && password) {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-2xl text-white rounded-2xl shadow-2xl">
        <CardHeader className="text-center pt-10">
          <div className="size-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="size-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight uppercase">
            Admin Terminal
          </CardTitle>
          <CardDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            UniVerse Internal Root
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-12 px-10">
          <Input
            placeholder="Admin Username"
            className="bg-white/5 border-white/10 h-11 px-4 rounded-xl text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            className="bg-white/5 border-white/10 h-11 px-4 rounded-xl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button
            className="w-full h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white mt-2"
            onClick={handleSubmit}
          >
            Unlock System
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
