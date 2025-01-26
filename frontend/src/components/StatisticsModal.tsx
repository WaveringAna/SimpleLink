import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

import { getLinkClickStats, getLinkSourceStats } from '../api/client';
import { ClickStats, SourceStats } from '../types/api';

interface StatisticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    linkId: number;
}

export function StatisticsModal({ isOpen, onClose, linkId }: StatisticsModalProps) {
    const [clicksOverTime, setClicksOverTime] = useState<ClickStats[]>([]);
    const [sourcesData, setSourcesData] = useState<SourceStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && linkId) {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const [clicksData, sourcesData] = await Promise.all([
                        getLinkClickStats(linkId),
                        getLinkSourceStats(linkId),
                    ]);
                    setClicksOverTime(clicksData);
                    setSourcesData(sourcesData);
                } catch (error) {
                    console.error("Failed to fetch statistics:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [isOpen, linkId]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Link Statistics</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center h-64">Loading...</div>
                ) : (
                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Clicks Over Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={clicksOverTime}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="clicks"
                                                stroke="#8884d8"
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Top Sources</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {sourcesData.map((source, index) => (
                                        <li
                                            key={source.source}
                                            className="flex items-center justify-between py-2 border-b last:border-0"
                                        >
                                            <span className="text-sm">
                                                <span className="font-medium text-muted-foreground mr-2">
                                                    {index + 1}.
                                                </span>
                                                {source.source}
                                            </span>
                                            <span className="text-sm font-medium">
                                                {source.count} clicks
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
