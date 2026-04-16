import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { form_id, answers } = await req.json();

    if (!form_id || !answers || !Array.isArray(answers)) {
      return new Response(
        JSON.stringify({ error: "form_id and answers array are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify form is published
    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("id, is_published")
      .eq("id", form_id)
      .eq("is_published", true)
      .single();

    if (formError || !form) {
      return new Response(
        JSON.stringify({ error: "Form not found or not published" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create response
    const { data: response, error: responseError } = await supabase
      .from("form_responses")
      .insert({ form_id })
      .select()
      .single();

    if (responseError) {
      return new Response(
        JSON.stringify({ error: responseError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert answers
    const answerRows = answers.map((a: { question_id: string; answer_value: string }) => ({
      response_id: response.id,
      question_id: a.question_id,
      answer_value: a.answer_value,
    }));

    const { error: answersError } = await supabase
      .from("response_answers")
      .insert(answerRows);

    if (answersError) {
      return new Response(
        JSON.stringify({ error: answersError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, response_id: response.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
