"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useWithdrawal } from "@/app/store/store";

type KeyType = "cpf" | "email" | "random" | "phone";

export const KEY_TYPE_OPTIONS: { value: KeyType; label: string }[] = [
	{ value: "cpf", label: "CPF" },
	{ value: "email", label: "Email" },
	{ value: "random", label: "Chave aleatória" },
	{ value: "phone", label: "Telefone" },
];

export const ACCOUNT_PIX_KEYS: Record<KeyType, string> = {
	cpf: "012.345.678-90",
	email: "usuario@email.com",
	random: "a1b2c3d4-e5f6-7890",
	phone: "+55 11 99999-9999",
};

export const PRESET_AMOUNTS = [20, 50, 100, 250, 500, 1000];

export function formatCurrency(value: number) {
	return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const withdrawalSchema = (balanceCents: number) =>
	z.object({
		amountCents: z
			.number()
			.min(3000, "O valor mínimo para saque é R$ 30,00")
			.max(balanceCents, "O valor não pode ser maior que o saldo disponível"),
	});

export function useWithdrawalForm(handleWBSOpen: (isOpen: boolean) => void) {
	const balance = useWithdrawal((state) => state.balance);
	const makeWithdrawal = useWithdrawal((state) => state.makeWithdrawal);

	const [amountCents, setAmountCents] = useState(0);
	const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
	const [keyType, setKeyType] = useState<KeyType>("cpf");
	const [step, setStep] = useState<"form" | "success">("form");
	const [displayAmount, setDisplayAmount] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const balanceCents = Math.floor(
		(parseFloat(balance.replace(",", ".")) || 0) * 100,
	);

	const validate = (cents: number) => {
		const result = withdrawalSchema(balanceCents).safeParse({ amountCents: cents });
		setError(result.success ? null : result.error.issues[0].message);
	};

	const handlePreset = (value: number) => {
		const cents = value * 100;
		setSelectedPreset(value);
		setAmountCents(cents);
		validate(cents);
	};

	const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const digits = e.target.value.replace(/\D/g, "");
		const cents = parseInt(digits || "0", 10);
		setAmountCents(cents);
		setSelectedPreset(null);
		validate(cents);
	};

	const handleClose = () => {
		handleWBSOpen(false);
		setTimeout(() => {
			setAmountCents(0);
			setSelectedPreset(null);
			setStep("form");
			setDisplayAmount(0);
			setError(null);
		}, 350);
	};

	const handleWithdraw = () => {
		const result = withdrawalSchema(balanceCents).safeParse({ amountCents });
		if (!result.success) {
			setError(result.error.issues[0].message);
			return;
		}
		makeWithdrawal(amountCents / 100);
		setDisplayAmount(0);
		setStep("success");
	};

	useEffect(() => {
		if (step !== "success") return;

		const end = amountCents / 100;
		let startTime: number | null = null;
		let rafId: number;
		const duration = 1500;

		const frame = (timestamp: number) => {
			if (!startTime) startTime = timestamp;
			const elapsed = timestamp - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - (1 - progress) ** 3;
			setDisplayAmount(eased * end);
			if (progress < 1) rafId = requestAnimationFrame(frame);
		};

		rafId = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(rafId);
	}, [step, amountCents]);

	return {
		balance,
		balanceCents,
		amountCents,
		selectedPreset,
		keyType,
		setKeyType,
		step,
		displayAmount,
		error,
		isBlocked: amountCents === 0 || !!error,
		isCpf: keyType === "cpf",
		handlePreset,
		handleInput,
		handleClose,
		handleWithdraw,
	};
}
