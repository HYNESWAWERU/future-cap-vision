import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, BarChart3, Bitcoin, Wallet, LineChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BtcKesChart from "@/components/BtcKesChart";
import MultiCryptoCharts from "@/components/MultiCryptoCharts";
import CryptoPortfolioTracker from "@/components/CryptoPortfolioTracker";
import { Button } from "@/components/ui/button";

export default function MarketPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="glass-card-hover rounded-xl overflow-hidden animate-border-shimmer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Toggle header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-background/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <LineChart className="h-3.5 w-3.5 text-primary" />
          </motion.div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Market & Portfolio
          </span>
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-profit"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <Tabs defaultValue="charts" className="w-full">
                <TabsList className="w-full h-8 bg-background/30 mb-3">
                  <TabsTrigger value="charts" className="text-[10px] gap-1 flex-1">
                    <BarChart3 className="h-3 w-3" />
                    Charts
                  </TabsTrigger>
                  <TabsTrigger value="btc" className="text-[10px] gap-1 flex-1">
                    <Bitcoin className="h-3 w-3" />
                    BTC/KES
                  </TabsTrigger>
                  <TabsTrigger value="portfolio" className="text-[10px] gap-1 flex-1">
                    <Wallet className="h-3 w-3" />
                    Portfolio
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="charts" className="mt-0">
                  <MultiCryptoCharts />
                </TabsContent>
                <TabsContent value="btc" className="mt-0">
                  <BtcKesChart />
                </TabsContent>
                <TabsContent value="portfolio" className="mt-0">
                  <CryptoPortfolioTracker />
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
