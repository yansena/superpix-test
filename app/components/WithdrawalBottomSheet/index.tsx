"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { z } from "zod";
import { useWithdrawal } from "@/app/store/store";

const withdrawalSchema = (balanceCents: number) =>
	z.object({
		amountCents: z
			.number()
			.min(3000, "O valor mínimo para saque é R$ 30,00")
			.max(balanceCents, "O valor não pode ser maior que o saldo disponível"),
	});

type KeyType = "cpf" | "email" | "random" | "phone";

const KEY_TYPE_OPTIONS: { value: KeyType; label: string }[] = [
	{ value: "cpf", label: "CPF" },
	{ value: "email", label: "Email" },
	{ value: "random", label: "Chave aleatória" },
	{ value: "phone", label: "Telefone" },
];

const ACCOUNT_PIX_KEYS: Record<KeyType, string> = {
	cpf: "012.345.678-90",
	email: "usuario@email.com",
	random: "a1b2c3d4-e5f6-7890",
	phone: "+55 11 99999-9999",
};

const PRESET_AMOUNTS = [20, 50, 100, 250, 500, 1000];

function formatCurrency(value: number) {
	return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface WBSProps {
	handleWBSOpen: (isOpen: boolean) => void;
	isOpen: boolean;
}

export function WithdrawalBottomSheet({ handleWBSOpen, isOpen }: WBSProps) {
	const balance = useWithdrawal((state) => state.balance);
	const makeWithdrawal = useWithdrawal((state) => state.makeWithdrawal);

	const [amountCents, setAmountCents] = useState<number>(0);
	const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
	const [keyType, setKeyType] = useState<KeyType>("cpf");
	const [step, setStep] = useState<"form" | "success">("form");
	const [displayAmount, setDisplayAmount] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const isCpf = keyType === "cpf";

	const balanceCents = Math.floor(
		(parseFloat(balance.replace(",", ".")) || 0) * 100,
	);

	const validate = (cents: number) => {
		const result = withdrawalSchema(balanceCents).safeParse({
			amountCents: cents,
		});
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

	const isBlocked = amountCents === 0 || !!error;

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

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={handleClose}
						className="fixed inset-0 bg-black/70 z-40"
					/>

					<motion.div
						initial={{ y: "100%" }}
						animate={{ y: 0 }}
						exit={{ y: "100%" }}
						transition={{ type: "spring", damping: 30, stiffness: 280 }}
						className="fixed bottom-0 left-0 right-0 z-50"
					>
						<div className="bg-linear-to-b from-[#00151F] from-40% to-[#002131] rounded-t-2xl max-h-[95vh] overflow-y-auto">
							<AnimatePresence mode="wait">
								{step === "form" && (
									<motion.div
										key="form"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0, x: -30 }}
										transition={{ duration: 0.2 }}
									>
										<div className="mt-2 flex flex-col items-center justify-center px-4">
											<button
												type="button"
												onClick={handleClose}
												className="w-8 h-8 absolute right-2 top-2 rounded-full flex items-center justify-center text-white transition-colors"
												aria-label="Fechar"
											>
												<X size={26} />
											</button>
											<Image
												src="/Rectangle 4988.png"
												alt="Banner"
												width={358}
												height={113}
												priority
												quality={100}
												className="mt-10 w-full h-auto"
											/>
										</div>

										<div className="px-4 pt-4 pb-8">
											<h2 className="text-xl font-bold text-white">Saque</h2>
											<p className="text-sm text-white mb-4">
												Saque mínimo R$30,00
											</p>

											<label
												htmlFor="withdrawal-amount"
												className="block text-sm font-medium text-white mb-1"
											>
												Digite o valor que deseja sacar
											</label>
											<p className="text-xs text-[#396076] mb-2">
												Disponível para saque no momento:{" "}
												<span className="font-bold text-[#FEFF00]">
													{formatCurrency(Number(balance))}
												</span>
											</p>
											<input
												id="withdrawal-amount"
												type="text"
												inputMode="decimal"
												value={formatCurrency(amountCents / 100)}
												onChange={handleInput}
												placeholder="Digite aqui..."
												className={`w-full bg-[#00151FA6] rounded-lg px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none transition-colors ${error ? "border border-red-500 mb-1" : "mb-4"}`}
											/>
											{error && (
												<p className="text-xs text-red-400 mb-4 mt-1">
													{error}
												</p>
											)}

											<div className="flex gap-3 mb-4">
												<div className="flex-1 flex flex-col">
													<p className="text-xs text-white mb-1">
														Tipo de chave
													</p>
													<div className="relative">
														<select
															value={keyType}
															onChange={(e) =>
																setKeyType(e.target.value as KeyType)
															}
															style={{ colorScheme: "dark" }}
															className="w-full appearance-none bg-[#00151FA6] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00e5b0] cursor-pointer"
														>
															{KEY_TYPE_OPTIONS.map((opt) => (
																<option key={opt.value} value={opt.value}>
																	{opt.label}
																</option>
															))}
														</select>
														<ChevronDown
															size={14}
															className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none"
														/>
													</div>
													{isCpf && (
														<p className="text-[11px] text-zinc-500 mt-2">
															Usamos o CPF cadastrado em sua conta. Ele não
															poderá ser alterado.
														</p>
													)}
												</div>

												<div className="flex-1 flex flex-col">
													<div className="flex items-center gap-1 mb-1">
														<p className="text-xs text-white">Chave PIX</p>
														<span className="text-[9px] bg-[#396076] text-black px-1.5 py-0.5 rounded font-bold leading-none">
															FIXO NA SUA CONTA
														</span>
													</div>
													<div className="flex items-center gap-2 bg-[#00151FA6] rounded-lg px-3 py-2.5">
														{isCpf && (
															<svg
																width="13"
																height="13"
																viewBox="0 0 13 13"
																fill="none"
																xmlns="http://www.w3.org/2000/svg"
																className="shrink-0"
															>
																<title>Closed Padlock</title>
																<path
																	d="M9.47917 2.979C8.28449 2.979 7.3125 3.95099 7.3125 5.14567C7.3125 6.34035 8.28449 7.31234 9.47917 7.31234C10.6738 7.31234 11.6458 6.34035 11.6458 5.14567C11.6458 3.95099 10.6738 2.979 9.47917 2.979ZM10.3477 4.93091L9.53524 5.74341C9.48234 5.7963 9.41305 5.82275 9.34375 5.82275C9.27445 5.82275 9.20516 5.7963 9.15226 5.74341L8.6106 5.20174C8.5048 5.09595 8.5048 4.92456 8.6106 4.81877C8.71639 4.71297 8.88778 4.71297 8.99357 4.81877L9.34375 5.16895L9.96476 4.54793C10.0706 4.44214 10.2419 4.44214 10.3477 4.54793C10.4535 4.65373 10.4535 4.82511 10.3477 4.93091Z"
																	fill="#396076"
																/>
																<path
																	d="M5.41973 7.04102C5.34144 7.04102 5.2621 7.04921 5.18222 7.06575C4.76381 7.15263 4.43056 7.49593 4.3528 7.9203C4.27715 8.33356 4.43241 8.732 4.7683 8.98578C4.83601 9.03709 4.87568 9.11696 4.87568 9.20186V9.47878C4.87568 9.77752 5.11875 10.0204 5.41735 10.0204C5.71596 10.0204 5.95902 9.77752 5.95902 9.47878V9.20186C5.95902 9.11696 5.99869 9.03696 6.06666 8.98578C6.34252 8.77723 6.50068 8.46342 6.50068 8.12461C6.50068 7.79718 6.35495 7.49064 6.10052 7.28382C5.90427 7.12406 5.66835 7.04102 5.41973 7.04102ZM5.41735 8.66628C5.1182 8.66628 4.87568 8.42376 4.87568 8.12461C4.87568 7.82545 5.1182 7.58295 5.41735 7.58295C5.7165 7.58295 5.95902 7.82545 5.95902 8.12461C5.95902 8.42376 5.7165 8.66628 5.41735 8.66628Z"
																	fill="#396076"
																/>
																<path
																	d="M6.7847 5.4165H3.79199V4.604C3.79199 3.70755 4.52053 2.979 5.41699 2.979C6.13471 2.979 6.76303 3.47462 6.96886 4.13545C7.19095 3.58025 7.5972 3.11171 8.10908 2.81109C7.51866 1.939 6.522 1.354 5.41699 1.354C3.62408 1.354 2.16699 2.81109 2.16699 4.604V5.4165C1.72011 5.4165 1.35449 5.78212 1.35449 6.229V10.8332C1.35449 11.28 1.72011 11.6457 2.16699 11.6457H8.66699C9.11387 11.6457 9.47949 11.28 9.47949 10.8332V7.854C8.07929 7.854 6.92011 6.7815 6.7847 5.4165ZM6.50033 9.33005V9.479C6.50033 10.0775 6.01554 10.5623 5.41699 10.5623C4.81845 10.5623 4.33366 10.0775 4.33366 9.479V9.33005C3.91116 8.95088 3.71615 8.38754 3.81907 7.82422C3.93554 7.18504 4.43929 6.66775 5.07303 6.53505C5.56054 6.43213 6.06158 6.55401 6.44345 6.86274C6.82262 7.17421 7.04199 7.63463 7.04199 8.12484C7.04199 8.58795 6.847 9.0213 6.50033 9.33005Z"
																	fill="#396076"
																/>
															</svg>
														)}
														<span className="text-sm text-zinc-300 truncate">
															{ACCOUNT_PIX_KEYS[keyType]}
														</span>
													</div>
													<p className="text-[11px] text-zinc-500 mt-2">
														O Pix cadastrado deve ser próprio. Não serão pagos
														prêmios em Pix de outras titularidades.
													</p>
												</div>
											</div>

											<div className="grid grid-cols-3 gap-2 mb-6">
												{PRESET_AMOUNTS.map((v) => (
													<button
														key={v}
														type="button"
														onClick={() => handlePreset(v)}
														className={`bg-linear-to-r from-[#00151F]/50 from-30% to-[#005A85]/30 rounded-lg py-3 text-sm font-semibold transition-all ${
															selectedPreset === v
																? "text-white"
																: "border-zinc-600 text-white"
														}`}
													>
														{formatCurrency(v)}
													</button>
												))}
											</div>

											<button
												type="button"
												onClick={handleWithdraw}
												disabled={isBlocked}
												className={`w-full bg-linear-to-r from-[#00FFAE] to-[#06FFF7] text-black font-black py-4 rounded-xl text-xl transition-all ${isBlocked ? "opacity-40 cursor-not-allowed" : "hover:brightness-110"}`}
											>
												Sacar agora
											</button>
										</div>
									</motion.div>
								)}

								{step === "success" && (
									<motion.div
										key="success"
										initial={{ opacity: 0, x: 30 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.25 }}
										className="flex flex-col items-center px-5 pt-4 pb-10 bg-[#00101DED]/93 min-h-[85vh] justify-between"
									>
										<div className="relative w-full flex justify-center pt-6 mb-4">
											<Image
												src="/MOEDAS.png"
												alt="Moedas"
												width={220}
												height={210}
											/>
											<button
												type="button"
												onClick={handleClose}
												className="absolute right-0 top-6 text-white"
												aria-label="Fechar"
											>
												<X size={32} />
											</button>
										</div>

										<span className="text-5xl font-black bg-linear-to-r from-[#00FFAE] to-[#06FFF7] bg-clip-text text-transparent font- mb-1">
											Parabéns!
										</span>
										<p className="text-sm text-white mb-6">
											Seu saque foi efetuado com sucesso
										</p>

										<div className="w-full  bg-linear-to-r from-[#00FFAE] from-10% to-[#06FFF7] to-90% rounded-t-4xl rounded-br-4xl px-6 py-5 flex flex-col items-center mb-6">
											<p className="text-sm text-[#00101D] font-medium mb-2 text-center flex items-center gap-1">
												<svg
													width="12"
													height="12"
													viewBox="0 0 24 24"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<title>Flame</title>
													<defs>
														<linearGradient
															id="flameGradient"
															x1="0%"
															y1="0%"
															x2="100%"
															y2="0%"
														>
															<stop offset="0%" stopColor="#00151F" />
															<stop offset="100%" stopColor="#005A85" />
														</linearGradient>
													</defs>
													<path
														d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
														fill="url(#flameGradient)"
													/>
												</svg>
												Até agora você ganhou um total de
											</p>
											<p className="text-3xl font-extrabold bg-linear-to-r from-[#00151F] from-85% to-[#005A85] bg-clip-text text-transparent my-1 tabular-nums">
												{formatCurrency(displayAmount)}
											</p>
											<p className="text-sm text-[#00101D] font-black mt-3">
												Aproveite sua onda de sorte
											</p>
											<ChevronDown size={35} className="text-[#00151F] mt-1" />
										</div>

										<button
											type="button"
											className="w-full bg-linear-to-r from-[#00FFAE]  to-[#06FFF7] text-black font-bold text-2xl py-4 rounded-xl hover:brightness-110 transition-all "
										>
											Deposite agora
										</button>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
