import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Link,
} from "@react-pdf/renderer";
import { Book, Page as BookPage } from "../../types";
import apiService from "../../services/api";

// Define styles for the PDF document
const styles = StyleSheet.create({
  // Page styles
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    paddingTop: 80, // Space for header
    paddingBottom: 50, // Space for footer
    paddingHorizontal: 60,
    fontFamily: "Times-Roman",
    fontSize: 12,
    lineHeight: 1.6,
  },
  // Title page styles
  titlePage: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 60,
    fontFamily: "Times-Roman",
    justifyContent: "center",
    alignItems: "center",
  },
  coverPage: {
    backgroundColor: "#ffffff",
  },
  fullPageImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  metadata: {
    fontSize: 12,
    color: "#666666",
    marginTop: 30,
    alignItems: "center", // add this
    textAlign: "center", // keep this
    // remove marginBottom from here
  },
  metadataLine: {
    marginBottom: 8, // add this for spacing between lines
    textAlign: "center",
  },
  // Fixed header for content pages
  pageHeader: {
    position: "absolute",
    top: 30,
    left: 60,
    right: 60,
    fontSize: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 5,
  },
  headerLine: {
    position: "absolute",
    top: 48, // Position it just below the header text
    left: 60,
    right: 60,
    height: 1,
    backgroundColor: "#000",
  },
  // Container for each book page's content
  pageContent: {
    marginBottom: 20, // Space between content of different book pages
  },
  // Markdown styles
  heading1: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 15,
  },
  heading2: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 12,
  },
  heading3: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 10,
  },
  boldText: { fontWeight: "bold" },
  italicText: { fontStyle: "italic" },
  image: {
    marginVertical: 10,
    // maxWidth: "100%",
    // alignSelf: "center",
  },
  imagePlaceholder: {
    fontSize: 10,
    color: "#666666",
    fontStyle: "italic",
    backgroundColor: "#f0f0f0",
    padding: 5,
    marginVertical: 5,
    textAlign: "center",
  },
  paragraph: {
    marginBottom: 10,
    textAlign: "justify",
  },
});

interface PdfDocumentProps {
  bookDetails: Book;
  pages: BookPage[];
  preloadedImages?: Record<string, string>;
}

// Separate component for the actual PDF document
const PdfDocument: React.FC<PdfDocumentProps & { imageMap: Record<string, string> }> = ({ 
  bookDetails, 
  pages, 
  imageMap 
}) => {
  const translatedPages = pages
    .filter((page) => page.translation?.data?.trim())
    .sort((a, b) => a.page_number - b.page_number);

  const renderMarkdownContent = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];

    lines.forEach((line, index) => {
      const imageMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
      if (imageMatch) {
        const imageUrl = apiService.getImageProxyUrl(imageMatch[2]);
        const objectUrl = imageMap[imageUrl];
        if (objectUrl) {
          elements.push(
            <View key={`img-${index}`}>
              <Image style={styles.image} src={objectUrl} />
            </View>
          );
        }
        return;
      }

      const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        const style =
          level === 1
            ? styles.heading1
            : level === 2
            ? styles.heading2
            : styles.heading3;
        elements.push(
          <Text key={`h-${index}`} style={style}>
            {headingText}
          </Text>
        );
        return;
      }
      if (line.trim()) {
        const processInline = (textLine: string) => {
          const parts: (string | JSX.Element)[] = [];
          let lastIndex = 0;
          const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
          let match;
          let partIndex = 0;

          while ((match = regex.exec(textLine)) !== null) {
            if (match.index > lastIndex) {
              parts.push(textLine.substring(lastIndex, match.index));
            }
            const matchedText = match[0];
            if (matchedText.startsWith("**")) {
              parts.push(
                <Text key={`b-${index}-${partIndex++}`} style={styles.boldText}>
                  {matchedText.slice(2, -2)}
                </Text>
              );
            } else {
              parts.push(
                <Text
                  key={`i-${index}-${partIndex++}`}
                  style={styles.italicText}
                >
                  {matchedText.slice(1, -1)}
                </Text>
              );
            }
            lastIndex = regex.lastIndex;
          }

          if (lastIndex < textLine.length) {
            parts.push(textLine.substring(lastIndex));
          }
          return <>{parts}</>;
        };

        elements.push(
          <Text key={`p-${index}`} style={styles.paragraph}>
            {processInline(line)}
          </Text>
        );
      }
    });

    return elements;
  };

  return (
    <Document
      title={`${bookDetails.title} - Translated Edition`}
      author={bookDetails.author}
      creator="SourceLibrary.org"
    >
      {/* Cover Page with thumbnail */}
      {bookDetails.thumbnail && imageMap[apiService.getImageProxyUrl(bookDetails.thumbnail)] && (
        <Page size="A4" style={styles.coverPage}>
          <Image
            style={styles.fullPageImage}
            src={imageMap[apiService.getImageProxyUrl(bookDetails.thumbnail)]}
          />
        </Page>
      )}

      <Page></Page>

      {/* Title Page */}
      <Page size="A4" style={styles.titlePage}>
        <Text style={styles.title}>{bookDetails.title}</Text>
        <Text style={styles.author}>by {bookDetails.author}</Text>
        <View style={styles.metadata}>
          <Text style={styles.metadataLine}>
            Original Language: {bookDetails.language} | Translation Language:{" "}
            {pages[0]?.translation?.language ?? "English"}
          </Text>
          <Text style={styles.metadataLine}>
            Powered by{" "}
            <Link src="https://www.sourcelibrary.org">SourceLibrary.org</Link>
          </Text>
        </View>
      </Page>

      {/* Content Pages */}
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.pageHeader} fixed>
          <Text>{bookDetails.title}</Text>
          <Text render={({ pageNumber }) => pageNumber} />
        </View>
        <View style={styles.headerLine} fixed />

        {/* Sequentially render content from all translated pages */}
        {translatedPages.map((page) => (
          <View key={page.id} style={styles.pageContent}>
            {page.translation?.data &&
              renderMarkdownContent(page.translation.data)}
          </View>
        ))}
      </Page>
    </Document>
  );
};

// Main component that handles image preloading or uses preloaded images
const PdfDownload: React.FC<PdfDocumentProps> = ({ bookDetails, pages, preloadedImages }) => {
  return <PdfDocument bookDetails={bookDetails} pages={pages} imageMap={preloadedImages ?? {}} />;  
};

export default PdfDownload;
