import { Routes, Route } from "react-router-dom";

import BookLibrary from "./pages/BookLibrary";
import BookDetails from "./pages/BookDetails";
import BookTranslator from "./pages/BookTranslator";
import BatchProcessing from "./pages/BatchProcessing";
import PdfUpload from "./pages/PdfUpload";
import AddBook from "./pages/AddBook";
import Login from "./pages/Login";

import { AuthProvider } from "./contexts/AuthContext";

export const SimpleRoutes = () => {
    return (
        <AuthProvider>
            <Routes>
                {/* Main Routes - No tenant prefix */}
                <Route path="/" element={<BookLibrary />} />
                <Route path="/library" element={<BookLibrary />} />
                <Route path="/book/:book_id" element={<BookDetails />} />
                <Route path="/translator/:book_id/:page_id" element={<BookTranslator />} />
                <Route path="/batch/:book_id" element={<BatchProcessing />} />
                <Route path="/pdf-upload/:book_id?" element={<PdfUpload />} />
                <Route path="/add-book" element={<AddBook />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </AuthProvider>
    );
};
