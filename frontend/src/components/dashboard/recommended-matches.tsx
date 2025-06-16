"use client";

import { useState } from "react"; // Added useState
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react"; // Removed MessageSquare, Calendar, ArrowRight
import { toast } from "sonner"; // Added for toast notifications

// Sample data for recommended matches
const recommendedMatches = [
  {
    id: 1,
    name: "Emma Wilson",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    initials: "EW",
    teachSkill: "Photoshop Mastery",
    learnSkill: "Excel Formulas",
    rating: 4.9,
    completedSessions: 23,
    availability: ["Weekends", "Evenings"]
  },
  {
    id: 2,
    name: "Jason Chen",
    avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    initials: "JC",
    teachSkill: "UX Design Fundamentals",
    learnSkill: "Data Analysis",
    rating: 4.7,
    completedSessions: 15,
    availability: ["Weekdays", "Mornings"]
  },
  {
    id: 3,
    name: "Sophia Rodriguez",
    avatar: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    initials: "SR",
    teachSkill: "Public Speaking",
    learnSkill: "PowerPoint Presentations",
    rating: 4.8,
    completedSessions: 31,
    availability: ["Flexible", "Weekends"]
  }
];

export function RecommendedMatches() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState('matching'); // 'matching', 'timeSelection'
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const currentMatch = recommendedMatches[currentIndex];

  const timeSlots = [
    "Monday 10:00 AM - 11:00 AM",
    "Wednesday 2:00 PM - 3:00 PM",
    "Friday 4:00 PM - 5:00 PM"
  ];

  const handleSkip = () => {
    setCurrentIndex(prevIndex => prevIndex + 1);
    setSelectedTimeSlot(''); // Reset time slot if skipped after viewing selection
  };

  const handleAccept = () => {
    setViewMode('timeSelection');
  };

  const handleSelectTimeSlot = (slot: string) => {
    setSelectedTimeSlot(slot);
  };

  const handleBackToMatches = () => {
    setViewMode('matching');
    setSelectedTimeSlot('');
  };

  const handleConfirmMentorship = () => {
    if (!currentMatch || !selectedTimeSlot) return;

    toast.success(
      `Mentorship session with ${currentMatch.name} for skill ${currentMatch.teachSkill} on ${selectedTimeSlot} confirmed!`,
      { duration: 5000 }
    );

    // Reset UI and move to next match
    setViewMode('matching');
    setSelectedTimeSlot('');
    setCurrentIndex(prevIndex => prevIndex + 1);
  };

  if (viewMode === 'matching') {
    if (!currentMatch) {
      return (
        <div className="space-y-6 w-full max-w-md mx-auto text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Recommended Matches</h2>
          <p className="text-muted-foreground mt-4">No more matches for now, check back later!</p>
        </div>
      );
    }
    return (
      <div className="space-y-6 flex flex-col items-center">
        <h2 className="text-2xl font-semibold tracking-tight self-start w-full max-w-md">Recommended Matches</h2>
        <Card key={currentMatch.id} className="overflow-hidden transition-all duration-200 hover:shadow-md mt-4 w-full max-w-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={currentMatch.avatar} alt={currentMatch.name} />
                <AvatarFallback>{currentMatch.initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{currentMatch.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  {currentMatch.rating} • {currentMatch.completedSessions} sessions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-0">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Teaches:</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="rounded-md">
                    {currentMatch.teachSkill}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Wants to learn:</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="rounded-md">
                    {currentMatch.learnSkill}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Availability:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {currentMatch.availability.map((time, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-muted rounded-md"
                    >
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2 pt-4 mt-4 border-t">
            <Button variant="outline" onClick={handleSkip} className="flex-1">Skip</Button>
            <Button onClick={handleAccept} className="flex-1">Accept</Button>
          </CardFooter>
        </Card>
      </div>
    );
  } else if (viewMode === 'timeSelection') {
    return (
      <div className="space-y-6 w-full max-w-md mx-auto">
        <h2 className="text-xl font-semibold tracking-tight text-center"> {/* Changed text size and centered */}
          Select a Time Slot for {currentMatch?.name}
        </h2>
        <div className="space-y-2 mt-4">
          {timeSlots.map((slot) => (
            <Button
              key={slot}
              variant={selectedTimeSlot === slot ? "default" : "outline"}
              onClick={() => handleSelectTimeSlot(slot)}
              className="w-full justify-start"
            >
              {slot}
            </Button>
          ))}
        </div>
        {selectedTimeSlot && (
          <p className="text-sm text-muted-foreground mt-2">
            Selected: {selectedTimeSlot}
          </p>
        )}
        <div className="flex gap-2 pt-4 mt-4 border-t">
          <Button variant="outline" onClick={handleBackToMatches} className="flex-1">
            Back to Matches
          </Button>
          <Button
            onClick={handleConfirmMentorship}
            disabled={!selectedTimeSlot}
            className="flex-1"
          >
            Confirm Mentorship
          </Button>
        </div>
      </div>
    );
  }
  return null; // Should not happen
}