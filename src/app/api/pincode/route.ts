import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get("pin");
  const postoffice = searchParams.get("postoffice");

  if (!pin && !postoffice) {
    return NextResponse.json(
      { error: "Please provide a pin or postoffice parameter" },
      { status: 400 }
    );
  }

  try {
    let url = "";
    if (pin) {
      // Validate PIN code format (6 digits)
      if (!/^\d{6}$/.test(pin)) {
        return NextResponse.json({ error: "Invalid PIN Code format" }, { status: 400 });
      }
      url = `https://api.postalpincode.in/pincode/${pin}`;
    } else if (postoffice) {
      url = `https://api.postalpincode.in/postoffice/${encodeURIComponent(postoffice)}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Postal API returned status ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Pincode API proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch postal details" },
      { status: 500 }
    );
  }
}
