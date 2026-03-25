import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount provided' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe secret key is not configured' },
        { status: 500 }
      );
    }

    // Convert ILS to the smallest unit (agorot) - Stripe uses cents-like units
    // ILS uses 2 decimal places, so multiply by 100
    const amountInAgorot = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInAgorot,
      currency: 'ils',
      metadata: {
        orderId: `order_${Date.now()}`,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
