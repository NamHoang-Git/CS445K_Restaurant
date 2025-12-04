import React from 'react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import ActiveTableOrders from '@/components/ActiveTableOrders';

const TableOrdersPage = () => {
    return (
        <section className="container mx-auto grid gap-2 z-10">
            <Card className="py-6 flex-row justify-between gap-6 border-card-foreground">
                <CardHeader>
                    <CardTitle className="text-lg text-highlight font-bold uppercase">
                        Quản lý đơn gọi món
                    </CardTitle>
                    <CardDescription>
                        Quản lý các đơn gọi món tại bàn
                    </CardDescription>
                </CardHeader>
            </Card>

            <ActiveTableOrders />
        </section>
    );
};

export default TableOrdersPage;
