import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExchangeRequest {
  fromDenomination: number;
  toDenomination: number;
  quantity: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fromDenomination, toDenomination, quantity }: ExchangeRequest = await req.json();

    console.log('Exchange request:', { fromDenomination, toDenomination, quantity });

    // Validate inputs
    if (!fromDenomination || !toDenomination || !quantity || quantity <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid input parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (fromDenomination === toDenomination) {
      return new Response(
        JSON.stringify({ error: 'Cannot exchange same denomination' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate exchange values
    const totalValue = fromDenomination * quantity;
    const resultingNotes = Math.floor(totalValue / toDenomination);
    
    if (resultingNotes === 0) {
      return new Response(
        JSON.stringify({ error: 'Exchange would result in zero notes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current ATM cash inventory
    const { data: cashInventory, error: fetchError } = await supabase
      .from('atm_cash')
      .select('*')
      .order('denomination', { ascending: false });

    if (fetchError) {
      console.error('Error fetching cash inventory:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to check ATM inventory' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if ATM has enough notes to give to user (toDenomination)
    const toDenomCash = cashInventory?.find(d => d.denomination === toDenomination);
    if (!toDenomCash) {
      return new Response(
        JSON.stringify({ error: `Target denomination ₹${toDenomination} not supported` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (toDenomCash.count < resultingNotes) {
      return new Response(
        JSON.stringify({ 
          error: `Insufficient ₹${toDenomination} notes in ATM. Available: ${toDenomCash.count}, Required: ${resultingNotes}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the fromDenomination exists in ATM (user will deposit this)
    const fromDenomCash = cashInventory?.find(d => d.denomination === fromDenomination);
    if (!fromDenomCash) {
      return new Response(
        JSON.stringify({ error: `Source denomination ₹${fromDenomination} not supported` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform the exchange - update both denominations
    // User gives ATM the fromDenomination notes, so ATM count increases
    const { error: updateFromError } = await supabase
      .from('atm_cash')
      .update({ count: fromDenomCash.count + quantity })
      .eq('denomination', fromDenomination);

    if (updateFromError) {
      console.error('Error updating source denomination:', updateFromError);
      return new Response(
        JSON.stringify({ error: 'Failed to update source denomination' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ATM gives user the toDenomination notes, so ATM count decreases
    const { error: updateToError } = await supabase
      .from('atm_cash')
      .update({ count: toDenomCash.count - resultingNotes })
      .eq('denomination', toDenomination);

    if (updateToError) {
      console.error('Error updating target denomination:', updateToError);
      // Rollback the first update
      await supabase
        .from('atm_cash')
        .update({ count: fromDenomCash.count })
        .eq('denomination', fromDenomination);

      return new Response(
        JSON.stringify({ error: 'Failed to complete exchange transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Exchange completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        exchanged: {
          from: { denomination: fromDenomination, quantity },
          to: { denomination: toDenomination, quantity: resultingNotes },
          totalValue
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Exchange function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});