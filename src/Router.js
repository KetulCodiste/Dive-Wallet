import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicRoutes from "./router/PublicRoutes";
import Mint from "components/Mint/Mint";
// import { UseWalletProvider } from "use-wallet";
// import { NETWORK_ID } from './config';

function Router(){
	return(
		<>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<PublicRoutes component={Mint} />} />
				</Routes>
			</BrowserRouter>
		</>
	);
} 

export default Router;
