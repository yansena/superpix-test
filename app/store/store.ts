import { create } from "zustand";

interface withdrawalState {
	balance: string;
	withdrawalAmount: number;
	makeWithdrawal: (value: number) => void;
}

export const useWithdrawal = create<withdrawalState>((set) => ({
	balance: "320",
	withdrawalAmount: 0,
	makeWithdrawal: (value) =>
		set((state) => ({
			balance: String(Number(state.balance) - value),
			withdrawalAmount: value,
		})),
}));
