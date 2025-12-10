import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpenIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from "@heroicons/react/24/outline";

import Button from "../../components/ui/Buttons/Button";
import Card from "../../components/ui/Card";
import TextArea from "../../components/ui/TextArea";
import Modal from "../../components/ui/Modal";
import ReactDiffViewer from "react-diff-viewer-continued";
import { apiService } from "../../services/api";
import type { Request } from "../../types";
import DashboardButton from "../../components/ui/Buttons/DashboardButton";

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "accepted":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <ClockIcon className="h-4 w-4 mr-1 text-yellow-500" />;
    case "accepted":
      return <CheckCircleIcon className="h-4 w-4 mr-1 text-green-600" />;
    case "rejected":
      return <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-red-600" />;
    default:
      return null;
  }
};

const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [activeTab, setActiveTab] = useState<
    "pending" | "accepted" | "rejected" | "all"
  >("pending");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [editableNewText, setEditableNewText] = useState("");
  const [reviewModalAction, setReviewModalAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [reviewModalNotes, setReviewModalNotes] = useState("");
  const [reviewNotesModalVisible, setReviewNotesModalVisible] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiService
      .getAllRequests()
      .then((data) => setRequests(data))
      .catch((err) => setError(err.message || "Failed to fetch requests"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (reviewModalVisible && selectedRequest) {
      setEditableNewText(selectedRequest.newText || "");
    }
  }, [reviewModalVisible, selectedRequest]);

  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const handleReview = (request: Request) => {
    setSelectedRequest(request);
    setReviewModalVisible(true);
  };

  const handleAction = (request: Request, type: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(type);
    setReviewNotes("");
    setActionModalVisible(true);
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === "all") return true;
    return req.status === activeTab;
  });

  const tabItems = [
    {
      key: "pending",
      label: `Pending (${requests.filter((r) => r.status === "pending").length
        })`,
    },
    {
      key: "accepted",
      label: `Accepted (${requests.filter((r) => r.status === "accepted").length
        })`,
    },
    {
      key: "rejected",
      label: `Rejected (${requests.filter((r) => r.status === "rejected").length
        })`,
    },
    { key: "all", label: `All (${requests.length})` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white pb-16">
      {/* Header */}
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm mb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-amber-100 border border-amber-200 flex-shrink-0 self-center">
                <DocumentTextIcon className="h-7 w-7 text-amber-700" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-gray-900">
                  Edit Requests Management
                </h1>
                <p className="text-sm text-gray-600 font-serif">
                  Review and manage content edit requests
                </p>
              </div>
            </div>
            <DashboardButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded font-serif font-medium text-base transition-colors duration-150 ${activeTab === tab.key
                ? "bg-amber-700 text-white"
                : "bg-gray-100 text-gray-900 hover:bg-amber-100"
                }`}
              onClick={() =>
                setActiveTab(
                  tab.key as "pending" | "accepted" | "rejected" | "all"
                )
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading/Error */}
        {loading && (
          <div className="text-center py-8 text-lg font-serif text-gray-500">
            Loading requests...
          </div>
        )}
        {error && (
          <div className="text-center py-8 text-lg font-serif text-red-500">
            {error}
          </div>
        )}

        {/* Table/List */}
        {!loading && !error && (
          <Card padding="md">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-amber-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 font-serif">
                      Request
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 font-serif">
                      Requester
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 font-serif">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 font-serif">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 font-serif">
                      Review
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 font-serif">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredRequests.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-amber-50 transition-colors"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="font-serif font-semibold text-gray-900 mb-1">
                          {record.description || "Page Update Request"}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 space-x-2">
                          <BookOpenIcon className="h-4 w-4 text-gray-400" />
                          <Link
                            to={`/book/${record.book_id}`}
                            style={{ color: "inherit" }}
                          >
                            {record.book_title && record.book_title.length > 25
                              ? record.book_title.slice(0, 25) + "..."
                              : record.book_title}
                          </Link>
                          <DocumentTextIcon className="h-4 w-4 text-gray-400 ml-2" />
                          <Link
                            to={`/translation/${record.book_id}/${record.page_id}`}
                            style={{ color: "inherit" }}
                          >
                            Page {record.page_number}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top font-serif text-gray-700">
                        {record.username}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold font-serif ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {getStatusIcon(record.status)}
                          {record.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top font-serif text-gray-500">
                        {record.created_at
                          ? new Date(record.created_at).toLocaleDateString()
                          : ""}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReview(record)}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" /> Review
                        </Button>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {record.status === "pending" ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAction(record, "approve")}
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />{" "}
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleAction(record, "reject")}
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 font-serif">
                            {record.review ? (
                              record.review
                            ) : (
                              <span className="italic text-gray-400">
                                No review notes
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Action Message */}
        {actionMessage && (
          <div className="mt-4 text-green-700 bg-green-100 border border-green-200 px-4 py-2 rounded font-serif">
            {actionMessage}
          </div>
        )}

        {/* Review Modal */}
        {selectedRequest && reviewModalVisible && (
          <Modal
            isOpen={reviewModalVisible}
            onClose={() => setReviewModalVisible(false)}
            title={selectedRequest.description || "Review Edit Request"}
            message={
              <div className="w-full max-w-[1200px] max-h-[80vh] overflow-y-auto p-2 bg-white rounded shadow-inner">
                <ReactDiffViewer
                  oldValue={selectedRequest.oldText || ""}
                  newValue={editableNewText}
                  splitView={true}
                  hideLineNumbers={false}
                  showDiffOnly={true}
                  styles={{
                    variables: {
                      light: {
                        diffViewerBackground: "#fff",
                        diffViewerColor: "#212529",
                      },
                    },
                  }}
                />
                {selectedRequest.status === "pending" && (
                  <div className="mt-4">
                    <span className="block text-sm font-serif text-gray-700 mb-1">
                      Edit New Text
                    </span>
                    <TextArea
                      rows={8}
                      value={editableNewText}
                      onChange={(e) => setEditableNewText(e.target.value)}
                      placeholder="Edit the new text here..."
                      className="font-mono overflow-y-auto resize-none"
                    />
                  </div>
                )}
              </div>
            }
            type="info"
            showCancel={true}
            confirmText="Save"
            cancelText="Close"
            extraButtons={
              selectedRequest.status === "pending"
                ? [
                  {
                    text: "Approve",
                    variant: "success",
                    onClick: () => {
                      setReviewModalAction("approve");
                      setReviewNotesModalVisible(true);
                    },
                  },
                  {
                    text: "Reject",
                    variant: "danger",
                    onClick: () => {
                      setReviewModalAction("reject");
                      setReviewNotesModalVisible(true);
                    },
                  },
                ]
                : []
            }
          />
        )}

        {/* Review Notes Modal (for approve/reject from review modal) */}
        {selectedRequest && reviewNotesModalVisible && (
          <Modal
            isOpen={reviewNotesModalVisible}
            onClose={() => {
              setReviewNotesModalVisible(false);
              setReviewModalAction(null);
              setReviewModalNotes("");
            }}
            title={
              reviewModalAction === "approve"
                ? "Approve Request"
                : "Reject Request"
            }
            message={
              <div>
                <TextArea
                  label="Add Review Notes"
                  rows={4}
                  value={reviewModalNotes}
                  onChange={(e) => setReviewModalNotes(e.target.value)}
                  placeholder="Add notes about this action..."
                />
              </div>
            }
            type={reviewModalAction === "approve" ? "success" : "error"}
            showCancel={true}
            confirmText={reviewModalAction === "approve" ? "Approve" : "Reject"}
            cancelText="Cancel"
            onConfirm={async () => {
              if (!selectedRequest) return;
              const newStatus =
                reviewModalAction === "approve" ? "accepted" : "rejected";
              try {
                const updated = await apiService.updateRequest(
                  selectedRequest.id!,
                  { status: newStatus, review: reviewModalNotes }
                );
                if (newStatus === "accepted" && selectedRequest.newText) {
                  await apiService.updatePageByRequest(
                    selectedRequest.page_id,
                    selectedRequest.requestType as "ocr" | "translation",
                    selectedRequest.newText
                  );
                }
                setRequests(
                  requests.map((req) => (req.id === updated.id ? updated : req))
                );
                setActionMessage(
                  `Request ${reviewModalAction === "approve" ? "approved" : "rejected"
                  } successfully`
                );
              } catch {
                setActionMessage("Failed to update request");
              }
              setReviewNotesModalVisible(false);
              setReviewModalAction(null);
              setReviewModalNotes("");
              setReviewModalVisible(false);
            }}
            onCancel={() => {
              setReviewNotesModalVisible(false);
              setReviewModalAction(null);
              setReviewModalNotes("");
            }}
          />
        )}

        {/* Action Modal */}
        {selectedRequest && actionModalVisible && (
          <Modal
            isOpen={actionModalVisible}
            onClose={() => setActionModalVisible(false)}
            title={
              actionType === "approve" ? "Approve Request" : "Reject Request"
            }
            message={
              <div>
                <TextArea
                  label="Add Review Notes"
                  rows={4}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this action..."
                />
              </div>
            }
            type={actionType === "approve" ? "success" : "error"}
            showCancel={true}
            confirmText={actionType === "approve" ? "Approve" : "Reject"}
            cancelText="Cancel"
            onConfirm={async () => {
              if (!selectedRequest) return;
              const newStatus =
                actionType === "approve" ? "accepted" : "rejected";
              try {
                const updated = await apiService.updateRequest(
                  selectedRequest.id!,
                  { status: newStatus, review: reviewNotes }
                );
                if (newStatus === "accepted" && selectedRequest.newText) {
                  await apiService.updatePageByRequest(
                    selectedRequest.page_id,
                    selectedRequest.requestType,
                    selectedRequest.newText
                  );
                }
                setRequests(
                  requests.map((req) => (req.id === updated.id ? updated : req))
                );
                setActionMessage(
                  `Request ${actionType === "approve" ? "approved" : "rejected"
                  } successfully`
                );
              } catch {
                setActionMessage("Failed to update request");
              }
              setActionModalVisible(false);
            }}
            onCancel={() => setActionModalVisible(false)}
          />
        )}
      </main>
    </div>
  );
};

export default RequestsPage;
