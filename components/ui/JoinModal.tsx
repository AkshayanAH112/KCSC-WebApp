"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import Button from "./Button";

export default function JoinModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-join-modal", handleOpen);
    return () => window.removeEventListener("open-join-modal", handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity" 
        onClick={() => setIsOpen(false)}
      />
      <div className="relative w-full max-w-xl bg-surface border border-outline-variant rounded-2xl shadow-elevated overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface bg-surface-container rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        {isSubmitted ? (
          <div className="p-12 flex flex-col items-center text-center space-y-4">
            <CheckCircle2 size={64} className="text-primary" />
            <h3 className="text-2xl font-display font-bold text-on-surface">Application Received!</h3>
            <p className="text-on-surface-variant">
              Welcome to the KCSC family. We&apos;ve sent the next steps to your email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-display font-bold text-on-surface">Join The Club</h3>
              <p className="text-sm text-on-surface-variant">Fill out the details below to register your interest.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">First Name</label>
                  <input required type="text" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="John" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">Last Name</label>
                  <input required type="text" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">Email</label>
                <input required type="email" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="john@example.com" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">Phone Number</label>
                <input required type="tel" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="+1 (555) 000-0000" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">Address</label>
                <input required type="text" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="123 Cricket Lane, City" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">Membership Type</label>
                  <select className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface appearance-none">
                    <option value="playing">Playing Member</option>
                    <option value="non-playing">Non-Playing Member</option>
                    <option value="junior">Junior Member</option>
                    <option value="coach">Coach / Staff</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">Role</label>
                  <select className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface appearance-none">
                    <option value="batsman">Batsman</option>
                    <option value="bowler">Bowler</option>
                    <option value="all-rounder">All-Rounder</option>
                    <option value="wicket-keeper">Wicket Keeper</option>
                    <option value="none">Not Applicable</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">Sports Achievements</label>
                <textarea className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface min-h-[100px]" placeholder="Tell us about your past clubs, highest scores, best bowling figures, or championships won..."></textarea>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2">
              Submit Application
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
