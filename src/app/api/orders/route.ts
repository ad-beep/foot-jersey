import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { CartItem } from '@/types';

interface OrderData {
  items: CartItem[];
  shippingInfo: {
    name: string;
    phone: string;
    email: string;
    country: string;
    city: string;
    street: string;
    zip: string;
    notes: string;
  };
  paymentMethod: 'bit' | 'paypal' | 'stripe';
  paymentStatus: 'pending' | 'completed' | 'failed';
  total: number;
  subtotal: number;
  currency: string;
  paymentIntentId?: string;
  paypalOrderId?: string;
  bitTransactionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OrderData = await request.json();

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!body.shippingInfo || !body.paymentMethod || !body.total) {
      return NextResponse.json(
        { error: 'Missing required order information' },
        { status: 400 }
      );
    }

    // Create order document
    const ordersCollection = collection(db, 'orders');
    const orderDoc = await addDoc(ordersCollection, {
      items: body.items.map((item) => ({
        jerseyId: item.jerseyId,
        teamName: item.jersey.teamName,
        size: item.size,
        quantity: item.quantity,
        customization: item.customization,
        totalPrice: item.totalPrice,
      })),
      shippingInfo: body.shippingInfo,
      paymentMethod: body.paymentMethod,
      paymentStatus: body.paymentStatus,
      paymentIntentId: body.paymentIntentId,
      paypalOrderId: body.paypalOrderId,
      bitTransactionId: body.bitTransactionId,
      subtotal: body.subtotal,
      total: body.total,
      currency: body.currency,
      createdAt: serverTimestamp(),
      status: 'pending',
    });

    return NextResponse.json(
      {
        orderId: orderDoc.id,
        message: 'Order created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
