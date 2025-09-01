import { Shield, Lock, Eye, Server } from "lucide-react";

interface SecurityIconProps {
  type: 'shield' | 'lock' | 'monitor' | 'server';
  className?: string;
}

export const SecurityIcon = ({ type, className = "" }: SecurityIconProps) => {
  const icons = {
    shield: Shield,
    lock: Lock,
    monitor: Eye,
    server: Server
  };
  
  const Icon = icons[type];
  
  return (
    <div className={`p-3 rounded-xl bg-gradient-card border border-security-border shadow-accent ${className}`}>
      <Icon className="w-6 h-6 text-accent" />
    </div>
  );
};