"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Calendar, ArrowRight } from "lucide-react";

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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">Recommended Matches</h2>
        <Button variant="outline" className="gap-1">
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {recommendedMatches.map((match) => (
          <Card key={match.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={match.avatar} alt={match.name} />
                  <AvatarFallback>{match.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{match.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {match.rating} • {match.completedSessions} sessions
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
                      {match.teachSkill}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Wants to learn:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="rounded-md">
                      {match.learnSkill}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Availability:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {match.availability.map((time, index) => (
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
              <Button className="flex-1">Request Swap</Button>
              <Button variant="outline" size="icon">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Calendar className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground mb-4">
          Want to find more specific matches? Try filtering by skill or availability.
        </p>
        <Button variant="outline">Advanced Search</Button>
      </div>
    </div>
  );
}