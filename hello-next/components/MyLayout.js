import Header from "./Header";

const LayoutStyles = {
    margin: 20,
    padding: 20,
    border: "1px solid #DDD"
};

const MyLayout = ({ children }) => {
    return (
        <div style={LayoutStyles}>
            <Header />
            {children}
        </div>
    );
};

export default MyLayout;
