import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Candidate } from "@/models/Candidate";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { identifier, password, courseId } = await request.json();
 
     if (!identifier || !password) {
       return NextResponse.json({ error: "Registration ID/Email and Password are required" }, { status: 400 });
     }
 
     // If courseId is provided, login to a specific course account (from course picker)
     if (courseId) {
       const candidate = await Candidate.findById(courseId);
       if (!candidate) {
         return NextResponse.json({ error: "Selected course account not found" }, { status: 401 });
       }

       // Check if account is active
       if (candidate.isActive === false) {
         return NextResponse.json({ error: "Your account access has been disabled by the administrator. Please contact support." }, { status: 403 });
       }

       const isPasswordMatch = await bcrypt.compare(password, candidate.password || "");
       if (!isPasswordMatch) {
         return NextResponse.json({ error: "Invalid password entered" }, { status: 401 });
       }

       const token = jwt.sign(
         {
           id: candidate._id,
           registrationId: candidate.registrationId,
           email: candidate.email,
           name: candidate.name,
         },
         JWT_SECRET,
         { expiresIn: "7d" }
       );

       const cookieStore = await cookies();
       cookieStore.set("token", token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: "strict",
         maxAge: 60 * 60 * 24 * 7,
         path: "/",
       });

       return NextResponse.json({
         success: true,
         message: "Authentication successful",
         candidate: {
           id: candidate._id,
           registrationId: candidate.registrationId,
           name: candidate.name,
           email: candidate.email,
         }
       });
     }

     // Find candidate by registrationId or email
     // If identifier looks like a registrationId (SMI-XXXX-XXXX), search by that
     const isRegistrationId = identifier.trim().toUpperCase().startsWith("SMI-");

     let candidates;
     if (isRegistrationId) {
       const candidate = await Candidate.findOne({ registrationId: identifier.trim() });
       candidates = candidate ? [candidate] : [];
     } else {
       // Search by email - may return multiple candidates (different courses)
       candidates = await Candidate.find({ email: identifier.trim().toLowerCase() });
     }

     if (!candidates || candidates.length === 0) {
       return NextResponse.json({ error: "Invalid registration details" }, { status: 401 });
     }

     // Verify password against the first candidate (all candidates with same email share same password or have individual passwords)
     // We need to find which candidate(s) have matching passwords
     const matchedCandidates = [];
     for (const candidate of candidates) {
       const isPasswordMatch = await bcrypt.compare(password, candidate.password || "");
       if (isPasswordMatch) {
         matchedCandidates.push(candidate);
       }
     }

     if (matchedCandidates.length === 0) {
       return NextResponse.json({ error: "Invalid password entered" }, { status: 401 });
     }

     // If only one matching candidate, login directly
     if (matchedCandidates.length === 1) {
       const candidate = matchedCandidates[0];

       // Check if account is active
       if (candidate.isActive === false) {
         return NextResponse.json({ error: "Your account access has been disabled by the administrator. Please contact support." }, { status: 403 });
       }

       const token = jwt.sign(
         {
           id: candidate._id,
           registrationId: candidate.registrationId,
           email: candidate.email,
           name: candidate.name,
         },
         JWT_SECRET,
         { expiresIn: "7d" }
       );

       const cookieStore = await cookies();
       cookieStore.set("token", token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: "strict",
         maxAge: 60 * 60 * 24 * 7,
         path: "/",
       });

       return NextResponse.json({
         success: true,
         message: "Authentication successful",
         candidate: {
           id: candidate._id,
           registrationId: candidate.registrationId,
           name: candidate.name,
           email: candidate.email,
         }
       });
     }

     // Multiple matching candidates — return course selection list
     const courseOptions = matchedCandidates.map(c => ({
       id: c._id,
       course: c.course,
       registrationId: c.registrationId,
       name: c.name,
       isActive: c.isActive !== false,
     }));

     return NextResponse.json({
       success: false,
       courseSelection: true,
       message: "Multiple course registrations found. Please select which course to access.",
       courses: courseOptions,
     });

  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to authenticate candidate" }, { status: 500 });
  }
}
