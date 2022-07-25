import React from "react";
import NavBar from "components/Common/NavBar/NavBar";
import Footer from "components/Common/Footer/Footer";

const PublicRoutes = ({component: Component, ...rest}) => {
	return(
		<>
			<NavBar />
				<Component {...rest} />
			<Footer />
		</>
	);
}

export default PublicRoutes;
