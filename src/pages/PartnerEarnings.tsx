import React, { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';

// Form schema
const formSchema = z.object({
  partnerCode: z.string().min(1, "Partner code is required").max(10)
});

interface PartnerStats {
  username: string;
  name: string;
  earnings: number;
  clickCount: number;
}

const PartnerEarnings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [monthName, setMonthName] = useState(format(new Date(), 'MMMM yyyy'));
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partnerCode: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setStats(null);
    
    try {
      // Get the first day of the current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // First, find the user with this partner code
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, username')
        .eq('partner_code', values.partnerCode)
        .single();
      
      if (userError || !userData) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Partner code not found",
        });
        setIsLoading(false);
        return;
      }
      
      // Next, get the click count for this month
      const { data: clickData, error: clickError } = await supabase
        .from('clicks')
        .select('*', { count: 'exact' })
        .eq('user_id', userData.id)
        .gte('created_at', firstDayOfMonth.toISOString());
      
      if (clickError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch earnings data",
        });
        setIsLoading(false);
        return;
      }
      
      // Calculate earnings ($0.10 per click)
      const clickCount = clickData?.length || 0;
      const earnings = clickCount * 0.10;
      
      setStats({
        username: userData.username,
        name: userData.name,
        clickCount,
        earnings
      });
      
      toast({
        title: "Success",
        description: "Partner earnings retrieved successfully",
      });
    } catch (error) {
      console.error("Error fetching partner earnings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while fetching partner earnings",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Earnings Leaderboard</CardTitle>
          <CardDescription>
            Enter a partner code to view their earnings for {monthName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="partnerCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter partner code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="mr-2">Loading</span>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                  </>
                ) : (
                  "View Earnings"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        {stats && (
          <CardFooter className="flex flex-col border-t p-4">
            <div className="w-full space-y-4">
              <div>
                <h3 className="text-lg font-medium">Partner Information</h3>
                <p className="text-gray-500">@{stats.username}</p>
                <p className="text-gray-500">{stats.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded p-3 text-center">
                  <p className="text-muted-foreground text-sm">Clicks</p>
                  <p className="text-2xl font-bold">{stats.clickCount}</p>
                </div>
                <div className="bg-muted rounded p-3 text-center">
                  <p className="text-muted-foreground text-sm">Earnings</p>
                  <p className="text-2xl font-bold">${stats.earnings.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default PartnerEarnings;
