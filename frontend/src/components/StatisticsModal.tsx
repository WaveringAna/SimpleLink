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
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

import { getLinkClickStats, getLinkSourceStats } from "../api/client";
import { ClickStats, SourceStats } from "../types/api";

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkId: number;
}

interface EnhancedClickStats extends ClickStats {
  sources?: { source: string; count: number }[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-background text-foreground p-4 rounded-lg shadow-lg border">
        <p className="font-medium">{label}</p>
        <p className="text-sm">Clicks: {data.clicks}</p>
        {data.sources && data.sources.length > 0 && (
          <div className="mt-2">
            <p className="font-medium text-sm">Sources:</p>
            <ul className="text-sm">
              {data.sources.map((source: { source: string; count: number }) => (
                <li key={source.source}>
                  {source.source}: {source.count}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function StatisticsModal({ isOpen, onClose, linkId }: StatisticsModalProps) {
  const [clicksOverTime, setClicksOverTime] = useState<EnhancedClickStats[]>([]);
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

          // Enhance clicks data with source information
          const enhancedClicksData = clicksData.map((clickData) => ({
            ...clickData,
            sources: sourcesData.filter((source) => source.date === clickData.date),
          }));

          setClicksOverTime(enhancedClicksData);
          setSourcesData(sourcesData);
        } catch (error: any) {
          console.error("Failed to fetch statistics:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: error.response?.data || "Failed to load statistics",
          });
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
                      <Tooltip content={<CustomTooltip />} />
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
