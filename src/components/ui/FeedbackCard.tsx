import React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  User,
  Clock,
  Tag,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface FeedbackItem {
  id: string;
  rating?: number;
  maxRating?: number;
  sentiment?: "positive" | "negative" | "neutral";
  comment?: string;
  customer: {
    name: string;
    email?: string;
    avatar?: string;
    id?: string;
  };
  createdAt: Date;
  source?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  resolved?: boolean;
  response?: {
    content: string;
    author: string;
    createdAt: Date;
  };
}

export interface FeedbackCardProps {
  feedback: FeedbackItem;
  onResolve?: (id: string) => void;
  onRespond?: (id: string) => void;
  onViewCustomer?: (customerId: string) => void;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  feedback,
  onResolve,
  onRespond,
  onViewCustomer,
  className,
  compact = false,
  showActions = true,
}) => {
  const renderStars = (rating: number, maxRating: number = 5) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            )}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">
          {rating}/{maxRating}
        </span>
      </div>
    );
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case "negative":
        return <ThumbsDown className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "border-l-green-500";
      case "negative":
        return "border-l-red-500";
      default:
        return "border-l-muted-foreground";
    }
  };

  return (
    <Card className={cn(
      feedback.sentiment && `border-l-4 ${getSentimentColor(feedback.sentiment)}`,
      feedback.resolved && "opacity-75",
      className
    )}>
      <CardHeader className={cn(
        "pb-3",
        compact && "pb-2"
      )}>
        <div className="flex items-start justify-between gap-3">
          {/* Customer Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {feedback.customer.avatar ? (
              <img
                src={feedback.customer.avatar}
                alt={feedback.customer.name}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  "font-medium truncate",
                  compact ? "text-sm" : "text-base"
                )}>
                  {feedback.customer.name}
                </h4>
                {feedback.customer.id && onViewCustomer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewCustomer(feedback.customer.id!)}
                    className="h-6 w-6 p-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <time>
                  {format(feedback.createdAt, "MMM dd, yyyy 'at' h:mm a")}
                </time>
                {feedback.source && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{feedback.source}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Rating/Sentiment */}
          <div className="flex items-center gap-2">
            {feedback.rating !== undefined ? (
              renderStars(feedback.rating, feedback.maxRating)
            ) : feedback.sentiment ? (
              <div className="flex items-center gap-1">
                {getSentimentIcon(feedback.sentiment)}
                <span className="text-sm capitalize text-muted-foreground">
                  {feedback.sentiment}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tags and Category */}
        {(feedback.category || feedback.tags?.length) && (
          <div className="flex items-center gap-2 flex-wrap">
            {feedback.category && (
              <Badge variant="outline" className="gap-1">
                <Tag className="h-3 w-3" />
                {feedback.category}
              </Badge>
            )}
            {feedback.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {feedback.resolved && (
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Resolved
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className={cn(
        "space-y-4",
        compact && "space-y-2"
      )}>
        {/* Comment */}
        {feedback.comment && (
          <div className={cn(
            "text-sm leading-relaxed",
            compact && "text-xs"
          )}>
            <p className="whitespace-pre-wrap">{feedback.comment}</p>
          </div>
        )}

        {/* Response */}
        {feedback.response && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>Response by {feedback.response.author}</span>
              <span>•</span>
              <time>
                {format(feedback.response.createdAt, "MMM dd, yyyy")}
              </time>
            </div>
            <p className="text-sm leading-relaxed">
              {feedback.response.content}
            </p>
          </div>
        )}

        {/* Metadata */}
        {feedback.metadata && Object.keys(feedback.metadata).length > 0 && (
          <div className="space-y-1 pt-2 border-t border-muted">
            {Object.entries(feedback.metadata).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="capitalize">
                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                </span>
                <span>
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            {!feedback.resolved && onResolve && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResolve(feedback.id)}
              >
                Mark Resolved
              </Button>
            )}
            {!feedback.response && onRespond && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRespond(feedback.id)}
              >
                Respond
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Feedback summary component
export interface FeedbackSummaryProps {
  feedbacks: FeedbackItem[];
  className?: string;
}

export const FeedbackSummary: React.FC<FeedbackSummaryProps> = ({
  feedbacks,
  className,
}) => {
  const stats = feedbacks.reduce(
    (acc, feedback) => {
      if (feedback.rating) {
        acc.totalRating += feedback.rating;
        acc.ratingCount += 1;
      }
      
      if (feedback.sentiment) {
        acc.sentimentCounts[feedback.sentiment] += 1;
      }
      
      if (feedback.resolved) {
        acc.resolvedCount += 1;
      }
      
      return acc;
    },
    {
      totalRating: 0,
      ratingCount: 0,
      sentimentCounts: { positive: 0, negative: 0, neutral: 0 },
      resolvedCount: 0,
    }
  );

  const averageRating = stats.ratingCount > 0 ? stats.totalRating / stats.ratingCount : 0;
  const resolvedPercentage = feedbacks.length > 0 ? (stats.resolvedCount / feedbacks.length) * 100 : 0;

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{feedbacks.length}</div>
          <div className="text-sm text-muted-foreground">Total Feedback</div>
        </CardContent>
      </Card>
      
      {stats.ratingCount > 0 && (
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
            </div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.sentimentCounts.positive}
          </div>
          <div className="text-sm text-muted-foreground">Positive</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{resolvedPercentage.toFixed(0)}%</div>
          <div className="text-sm text-muted-foreground">Resolved</div>
        </CardContent>
      </Card>
    </div>
  );
};