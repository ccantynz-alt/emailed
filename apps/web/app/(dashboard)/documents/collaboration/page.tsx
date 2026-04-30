"use client";

import { useState, useCallback } from "react";
import { Box, Text, Card, CardContent, Button, Input } from "@alecrae/ui";
import { motion, AnimatePresence } from "motion/react";
import {
  staggerSlow,
  fadeInUp,
  useAlecRaeReducedMotion,
  withReducedMotion,
  SPRING_BOUNCY,
} from "../../../../lib/animations";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: "owner" | "editor" | "commenter" | "viewer";
  online: boolean;
  cursorColor: string;
  lastActive: string;
}

interface Comment {
  id: string;
  author: string;
  authorColor: string;
  text: string;
  timestamp: string;
  resolved: boolean;
  replies: { author: string; text: string; timestamp: string }[];
  selection?: string;
}

interface Suggestion {
  id: string;
  author: string;
  type: "insertion" | "deletion" | "replacement";
  original: string;
  proposed: string;
  timestamp: string;
  status: "pending" | "accepted" | "rejected";
}

const COLLABORATORS: Collaborator[] = [
  { id: "u1", name: "Craig Taylor", email: "craig@alecrae.com", role: "owner", online: true, cursorColor: "bg-violet-500", lastActive: "Now" },
  { id: "u2", name: "Sarah Chen", email: "sarah@acmecorp.com", role: "editor", online: true, cursorColor: "bg-cyan-500", lastActive: "Now" },
  { id: "u3", name: "Alex Rivera", email: "alex@startup.io", role: "editor", online: false, cursorColor: "bg-emerald-500", lastActive: "2 hours ago" },
  { id: "u4", name: "Jordan Lee", email: "jordan@company.com", role: "commenter", online: true, cursorColor: "bg-amber-500", lastActive: "Now" },
  { id: "u5", name: "Priya Patel", email: "priya@techpartner.com", role: "viewer", online: false, cursorColor: "bg-pink-500", lastActive: "Yesterday" },
];

const COMMENTS: Comment[] = [
  {
    id: "c1",
    author: "Sarah Chen",
    authorColor: "bg-cyan-500",
    text: "Should we include the updated revenue projections here? The Q2 actuals came in higher than forecast.",
    timestamp: "2 hours ago",
    resolved: false,
    selection: "Revenue is projected to grow 34% year-over-year",
    replies: [
      { author: "Craig Taylor", text: "Yes, let's update with actuals. Can you pull the numbers from the finance sheet?", timestamp: "1 hour ago" },
      { author: "Sarah Chen", text: "On it. Will update by EOD.", timestamp: "45 min ago" },
    ],
  },
  {
    id: "c2",
    author: "Jordan Lee",
    authorColor: "bg-amber-500",
    text: "The competitive analysis section needs the latest Superhuman pricing. They raised prices last month.",
    timestamp: "4 hours ago",
    resolved: false,
    selection: "Competitor pricing comparison",
    replies: [],
  },
  {
    id: "c3",
    author: "Alex Rivera",
    authorColor: "bg-emerald-500",
    text: "Love the new product roadmap section. Very clear and actionable.",
    timestamp: "Yesterday",
    resolved: true,
    replies: [],
  },
  {
    id: "c4",
    author: "Priya Patel",
    authorColor: "bg-pink-500",
    text: "Can we add a section about the API integration timeline? Our team needs visibility on this.",
    timestamp: "Yesterday",
    resolved: false,
    selection: "Technical Integration Plan",
    replies: [
      { author: "Craig Taylor", text: "Great idea. Adding it to the appendix.", timestamp: "Yesterday" },
    ],
  },
];

const SUGGESTIONS: Suggestion[] = [
  {
    id: "s1",
    author: "Sarah Chen",
    type: "replacement",
    original: "We expect moderate growth in Q3",
    proposed: "We project 34% revenue growth in Q3, driven by enterprise expansion",
    timestamp: "1 hour ago",
    status: "pending",
  },
  {
    id: "s2",
    author: "Jordan Lee",
    type: "insertion",
    original: "",
    proposed: "Note: All projections assume current market conditions and exclude potential M&A activity.",
    timestamp: "3 hours ago",
    status: "pending",
  },
  {
    id: "s3",
    author: "Alex Rivera",
    type: "deletion",
    original: "This section is still under review and should not be shared externally.",
    proposed: "",
    timestamp: "Yesterday",
    status: "accepted",
  },
];

function roleColor(role: Collaborator["role"]): string {
  switch (role) {
    case "owner": return "bg-violet-500/20 text-violet-400";
    case "editor": return "bg-blue-500/20 text-blue-400";
    case "commenter": return "bg-amber-500/20 text-amber-400";
    case "viewer": return "bg-surface-secondary text-content-tertiary";
  }
}

function suggestionTypeLabel(type: Suggestion["type"]): { label: string; color: string } {
  switch (type) {
    case "insertion": return { label: "Added", color: "text-emerald-400" };
    case "deletion": return { label: "Removed", color: "text-red-400" };
    case "replacement": return { label: "Changed", color: "text-amber-400" };
  }
}

export default function CollaborationPage(): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const [activeTab, setActiveTab] = useState<"collaborators" | "comments" | "suggestions" | "activity">("collaborators");
  const [comments, setComments] = useState<Comment[]>(COMMENTS);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(SUGGESTIONS);
  const [newComment, setNewComment] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Collaborator["role"]>("editor");

  const resolveComment = useCallback((id: string): void => {
    setComments((prev: Comment[]) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c)),
    );
  }, []);

  const acceptSuggestion = useCallback((id: string): void => {
    setSuggestions((prev: Suggestion[]) =>
      prev.map((s) => (s.id === id ? { ...s, status: "accepted" as const } : s)),
    );
  }, []);

  const rejectSuggestion = useCallback((id: string): void => {
    setSuggestions((prev: Suggestion[]) =>
      prev.map((s) => (s.id === id ? { ...s, status: "rejected" as const } : s)),
    );
  }, []);

  const onlineCount = COLLABORATORS.filter((c) => c.online).length;
  const openComments = comments.filter((c) => !c.resolved).length;
  const pendingSuggestions = suggestions.filter((s) => s.status === "pending").length;

  const tabs = [
    { id: "collaborators" as const, label: "People", count: COLLABORATORS.length },
    { id: "comments" as const, label: "Comments", count: openComments },
    { id: "suggestions" as const, label: "Suggestions", count: pendingSuggestions },
    { id: "activity" as const, label: "Activity", count: undefined },
  ];

  return (
    <Box className="flex-1 overflow-y-auto p-6">
      <motion.div {...withReducedMotion(fadeInUp, reduced)}>
        <Box className="max-w-4xl mx-auto space-y-6">
          <Box className="flex items-center justify-between">
            <Box>
              <Text variant="heading-lg" className="font-bold">
                Collaboration
              </Text>
              <Text variant="body-md" muted className="mt-1">
                Q3 Strategy Brief &mdash; {onlineCount} online now
              </Text>
            </Box>
            <Box className="flex items-center gap-2">
              <Box className="flex -space-x-2">
                {COLLABORATORS.filter((c) => c.online).map((c) => (
                  <Box
                    key={c.id}
                    className={`w-8 h-8 rounded-full ${c.cursorColor} flex items-center justify-center border-2 border-surface`}
                    title={c.name}
                  >
                    <Text variant="caption" className="text-white font-semibold text-xs">
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          <Box className="flex items-center gap-1 p-1 rounded-lg bg-surface-secondary">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "primary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1"
              >
                {tab.label}{tab.count !== undefined ? ` (${String(tab.count)})` : ""}
              </Button>
            ))}
          </Box>

          <AnimatePresence mode="wait">
            {activeTab === "collaborators" && (
              <motion.div
                key="collaborators"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={SPRING_BOUNCY}
                className="space-y-4"
              >
                <Card>
                  <CardContent>
                    <Box className="space-y-3">
                      <Text variant="label" className="font-semibold">
                        Invite People
                      </Text>
                      <Box className="flex items-center gap-2">
                        <Box className="flex-1">
                          <Input
                            label=""
                            variant="email"
                            placeholder="Enter email address..."
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </Box>
                        <Box
                          as="select"
                          className="px-3 py-2 rounded-lg bg-surface border border-border text-sm text-content"
                          value={inviteRole}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setInviteRole(e.target.value as Collaborator["role"])
                          }
                        >
                          <Box as="option" value="editor">Editor</Box>
                          <Box as="option" value="commenter">Commenter</Box>
                          <Box as="option" value="viewer">Viewer</Box>
                        </Box>
                        <Button variant="primary" disabled={!inviteEmail.trim()}>
                          Invite
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                <motion.div variants={staggerSlow} initial="initial" animate="animate" className="space-y-2">
                  {COLLABORATORS.map((collab) => (
                    <motion.div key={collab.id} variants={fadeInUp}>
                      <Card>
                        <CardContent>
                          <Box className="flex items-center gap-3">
                            <Box className="relative">
                              <Box className={`w-10 h-10 rounded-full ${collab.cursorColor} flex items-center justify-center`}>
                                <Text variant="caption" className="text-white font-semibold">
                                  {collab.name.split(" ").map((n) => n[0]).join("")}
                                </Text>
                              </Box>
                              {collab.online && (
                                <Box className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface" />
                              )}
                            </Box>
                            <Box className="flex-1 min-w-0">
                              <Text variant="body-sm" className="font-medium">
                                {collab.name}
                              </Text>
                              <Text variant="caption" muted>
                                {collab.email}
                              </Text>
                            </Box>
                            <Box className={`px-2 py-0.5 rounded-full text-xs ${roleColor(collab.role)}`}>
                              <Text variant="caption" className="font-medium capitalize">
                                {collab.role}
                              </Text>
                            </Box>
                            <Text variant="caption" muted className="hidden md:block">
                              {collab.lastActive}
                            </Text>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {activeTab === "comments" && (
              <motion.div
                key="comments"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={SPRING_BOUNCY}
                className="space-y-4"
              >
                <Card>
                  <CardContent>
                    <Box className="flex items-center gap-2">
                      <Box className="flex-1">
                        <Input
                          label=""
                          variant="text"
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                      </Box>
                      <Button variant="primary" size="sm" disabled={!newComment.trim()}>
                        Post
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                <motion.div variants={staggerSlow} initial="initial" animate="animate" className="space-y-3">
                  {comments.map((comment) => (
                    <motion.div key={comment.id} variants={fadeInUp}>
                      <Card className={`border-l-4 ${comment.resolved ? "border-l-emerald-500 opacity-60" : "border-l-amber-500"}`}>
                        <CardContent>
                          <Box className="space-y-3">
                            {comment.selection && !comment.resolved && (
                              <Box className="px-3 py-1.5 rounded bg-amber-500/10 border-l-2 border-l-amber-500">
                                <Text variant="caption" className="italic text-amber-400">
                                  &quot;{comment.selection}&quot;
                                </Text>
                              </Box>
                            )}
                            <Box className="flex items-start gap-3">
                              <Box className={`w-7 h-7 rounded-full ${comment.authorColor} flex items-center justify-center flex-shrink-0`}>
                                <Text variant="caption" className="text-white font-semibold text-xs">
                                  {comment.author.split(" ").map((n) => n[0]).join("")}
                                </Text>
                              </Box>
                              <Box className="flex-1 min-w-0">
                                <Box className="flex items-center gap-2">
                                  <Text variant="body-sm" className="font-medium">
                                    {comment.author}
                                  </Text>
                                  <Text variant="caption" muted>
                                    {comment.timestamp}
                                  </Text>
                                </Box>
                                <Text variant="body-sm" muted className="mt-1">
                                  {comment.text}
                                </Text>
                              </Box>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resolveComment(comment.id)}
                              >
                                {comment.resolved ? "Reopen" : "Resolve"}
                              </Button>
                            </Box>
                            {comment.replies.length > 0 && (
                              <Box className="ml-10 space-y-2 border-l-2 border-border pl-3">
                                {comment.replies.map((reply, i) => (
                                  <Box key={i} className="space-y-0.5">
                                    <Box className="flex items-center gap-2">
                                      <Text variant="caption" className="font-medium">
                                        {reply.author}
                                      </Text>
                                      <Text variant="caption" muted>
                                        {reply.timestamp}
                                      </Text>
                                    </Box>
                                    <Text variant="caption" muted>
                                      {reply.text}
                                    </Text>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {activeTab === "suggestions" && (
              <motion.div
                key="suggestions"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={SPRING_BOUNCY}
                className="space-y-3"
              >
                {suggestions.map((sug) => {
                  const typeInfo = suggestionTypeLabel(sug.type);
                  return (
                    <Card key={sug.id} className={sug.status !== "pending" ? "opacity-50" : ""}>
                      <CardContent>
                        <Box className="space-y-3">
                          <Box className="flex items-center justify-between">
                            <Box className="flex items-center gap-2">
                              <Text variant="body-sm" className="font-medium">
                                {sug.author}
                              </Text>
                              <Text variant="caption" className={typeInfo.color}>
                                {typeInfo.label}
                              </Text>
                              <Text variant="caption" muted>
                                {sug.timestamp}
                              </Text>
                            </Box>
                            {sug.status === "pending" ? (
                              <Box className="flex items-center gap-1">
                                <Button variant="primary" size="sm" onClick={() => acceptSuggestion(sug.id)}>
                                  Accept
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => rejectSuggestion(sug.id)}>
                                  Reject
                                </Button>
                              </Box>
                            ) : (
                              <Box className={`px-2 py-0.5 rounded-full text-xs ${sug.status === "accepted" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                                <Text variant="caption" className="font-medium capitalize">
                                  {sug.status}
                                </Text>
                              </Box>
                            )}
                          </Box>
                          {sug.original && (
                            <Box className="px-3 py-2 rounded bg-red-500/10 border-l-2 border-l-red-500">
                              <Text variant="caption" className="line-through text-red-400">
                                {sug.original}
                              </Text>
                            </Box>
                          )}
                          {sug.proposed && (
                            <Box className="px-3 py-2 rounded bg-emerald-500/10 border-l-2 border-l-emerald-500">
                              <Text variant="caption" className="text-emerald-400">
                                {sug.proposed}
                              </Text>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </motion.div>
            )}

            {activeTab === "activity" && (
              <motion.div
                key="activity"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={SPRING_BOUNCY}
                className="space-y-2"
              >
                {[
                  { actor: "Sarah Chen", action: "edited section \"Revenue Projections\"", time: "45 min ago", color: "bg-cyan-500" },
                  { actor: "Craig Taylor", action: "replied to a comment", time: "1 hour ago", color: "bg-violet-500" },
                  { actor: "Jordan Lee", action: "added a comment on \"Competitive Analysis\"", time: "2 hours ago", color: "bg-amber-500" },
                  { actor: "Sarah Chen", action: "accepted a suggestion", time: "3 hours ago", color: "bg-cyan-500" },
                  { actor: "Alex Rivera", action: "edited section \"Product Roadmap\"", time: "5 hours ago", color: "bg-emerald-500" },
                  { actor: "Craig Taylor", action: "created version \"v10 - Final Draft\"", time: "Yesterday", color: "bg-violet-500" },
                  { actor: "Priya Patel", action: "viewed the document", time: "Yesterday", color: "bg-pink-500" },
                  { actor: "Jordan Lee", action: "resolved 2 comments", time: "2 days ago", color: "bg-amber-500" },
                ].map((entry, i) => (
                  <Card key={i}>
                    <CardContent>
                      <Box className="flex items-center gap-3">
                        <Box className={`w-7 h-7 rounded-full ${entry.color} flex items-center justify-center flex-shrink-0`}>
                          <Text variant="caption" className="text-white font-semibold text-xs">
                            {entry.actor.split(" ").map((n) => n[0]).join("")}
                          </Text>
                        </Box>
                        <Box className="flex-1">
                          <Text variant="body-sm">
                            <Text as="span" variant="body-sm" className="font-medium">{entry.actor}</Text>
                            {" "}{entry.action}
                          </Text>
                        </Box>
                        <Text variant="caption" muted>
                          {entry.time}
                        </Text>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </motion.div>
    </Box>
  );
}
