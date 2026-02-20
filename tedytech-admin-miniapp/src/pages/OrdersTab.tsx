import { useEffect, useState } from "react";
import { OrderTabs } from "@/components/orders/OrderTabs";
import { OrderList } from "@/components/orders/OrderList";
import { OrderCard } from "@/components/orders/OrderCard";
import { ExchangeCard } from "@/components/orders/ExchangeCard";
import { ExchangeDetailSheet } from "@/components/orders/ExchangeDetailSheet";
import { useOrders } from "@/hooks/useOrders";
import { useExchangeRequests } from "@/hooks/useExchanges";
import type { AdminOrderStatus, ExchangeRequest } from "@/types/order";

export function OrdersTab() {
  const {
    orders,
    isLoading: ordersLoading,
    error: ordersError,
    updateStatus,
  } = useOrders();
  const {
    data: exchanges,
    isLoading: exchangesLoading,
    isMockData: exchangesUsingMockData,
    error: exchangesError,
    updateExchange,
  } = useExchangeRequests();
  const [selectedExchange, setSelectedExchange] = useState<ExchangeRequest | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const canMutateExchanges = !exchangesLoading && !exchangesUsingMockData;

  useEffect(() => {
    if (!canMutateExchanges) {
      setSelectedExchange(null);
    }
  }, [canMutateExchanges]);

  const handleStatusChange = async (orderId: string, status: AdminOrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateStatus(orderId, status);
    } catch (error) {
      console.error("[OrdersTab] Failed to update order status", error);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <OrderTabs
        defaultTab="actions"
        actionsCount={orders.length}
        exchangesCount={exchanges.length}
        actionsContent={
          <OrderList
            items={orders}
            renderItem={(order) => (
              <OrderCard
                order={order}
                isUpdating={updatingOrderId === order._id}
                onStatusChange={(status) => void handleStatusChange(order._id, status)}
              />
            )}
            isLoading={ordersLoading}
            error={ordersError}
            emptyMessage="No orders yet"
            emptyDescription="Customer orders will appear here"
          />
        }
        exchangesContent={
          <OrderList
            items={exchanges}
            renderItem={(exchange) => (
              <ExchangeCard
                exchange={exchange}
                onClick={canMutateExchanges ? () => setSelectedExchange(exchange) : undefined}
              />
            )}
            isLoading={exchangesLoading}
            error={exchangesError}
            emptyMessage="No exchange requests yet"
            emptyDescription="Customer exchange requests will appear here"
          />
        }
      />

      {/* Exchange Detail Sheet */}
      <ExchangeDetailSheet
        exchange={selectedExchange}
        onUpdate={updateExchange as any}
        onClose={() => setSelectedExchange(null)}
      />
    </div>
  );
}
