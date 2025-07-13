import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/AppLayout";
import {
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  Plus
} from "lucide-react";

const Ecommerce = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">E-commerce Dashboard</h1>
            <p className="text-muted-foreground">Manage your online store and track sales</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">$47,329</p>
                  <p className="text-xs text-green-600">+23.1% from last month</p>
                </div>
                <DollarSign className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Orders</p>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-xs text-green-600">+12.5% from last month</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your HigherUp.ai E-commerce Platform is Ready!</CardTitle>
            <CardDescription>Start selling products and services with our integrated e-commerce solution</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Your complete e-commerce platform is fully operational and ready to dominate the market.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Ecommerce;