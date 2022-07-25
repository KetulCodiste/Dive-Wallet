import React from "react";
import FooterLogo from "images/footer-logo.png";

function Footer(){
    return(
        <>
        <div className="overlay"></div>
        <footer className="mainfoot color-white text-center pt-md-5 pb-md-4 pt-3 pb-3 mt-5">
		<div className="container">		
			<div className="middle-foot py-4">
				<img src={FooterLogo} alt="Apollo" width="30%"/>		
			</div>
			<div className="bottom-foot">
				<p className="mb-0">Copyright © 2022 Dive Wallet. All rights Reserved.</p>
			</div>
		</div>	
	</footer>
        </>
    );
}

export default Footer;