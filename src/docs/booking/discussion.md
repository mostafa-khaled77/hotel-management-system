# Booking Module - Discussion & Pending Decisions

## 1. Overview & Purpose
This document serves as the discussion and decision-tracking record for the Booking module. The accompanying `booking-contract.md` is currently a preliminary draft subject to review before implementation is finalized.

Several booking-related business and technical decisions remain open, including:
- Booking status transitions and lifecycle rules.
- Room availability and overlapping date validation rules.
- Cancellation policies and late-cancellation handling.
- Pricing behavior during booking updates.
- Concurrency control and race-condition prevention strategies.

## 2. Objectives of This Document
The purpose of this discussion document is to:
- Identify unresolved business rules and technical design decisions.
- Present relevant options along with their architectural trade-offs.
- Record proposed solutions and the engineering reasoning behind them.
- Collect mentor feedback and document the final agreed-upon decisions.

## 3. Review & Approval Workflow
- Until these pending decisions are reviewed and approved, the corresponding rules in the API contract must be treated as **proposals** rather than finalized requirements.
- Once the review is complete and feedback is integrated, both the contract and the related backend implementation will be updated to reflect the approved decisions.