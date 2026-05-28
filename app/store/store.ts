import { create } from "zustand";

interface withdrawalState {
	balance: string;
	makeWithdrawal: (value: number) => void;
}

export const useWithdrawal = create<withdrawalState>((set) => ({
	balance: "320",
	makeWithdrawal: (value) =>
		set((state) => ({
			...state,
			balance: String(Number(state.balance) - value),
		})),
}));
