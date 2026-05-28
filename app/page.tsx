"use client";
import { useState } from "react";
import { WithdrawalBottomSheet } from "./components/WithdrawalBottomSheet";

export default function Home() {
	const [openModal, setOpenModal] = useState<boolean>(false);

	const handleOpenWithdrawModal = () => {
		setOpenModal((oldState) => !oldState);
	};

	return (
		<div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
			<button
				type="button"
				onClick={handleOpenWithdrawModal}
				className="border borde-1 border-zinc-500 rounded-md px-2"
			>
				Abrir Deposito
			</button>
			<WithdrawalBottomSheet isOpen={openModal} handleWBSOpen={setOpenModal} />
		</div>
	);
}
