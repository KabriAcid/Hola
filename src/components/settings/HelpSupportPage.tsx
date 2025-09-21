import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HelpCircle,
  MessageSquare,
  FileText,
  Shield,
  Info,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  Star,
  Bug,
  MessageCircle,
} from "lucide-react";
import { Header } from "../layout/Header";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface HelpSupportPageProps {}

interface SettingsRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  external?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon: Icon,
  label,
  subtitle,
  onPress,
  showArrow = false,
  external = false,
}) => {
  return (
    <motion.button
      onClick={onPress}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="p-2 rounded-full bg-gray-100">
          <Icon className="w-5 h-5 text-gray-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-black">{label}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {external && <ExternalLink className="w-4 h-4 text-gray-400" />}
        {showArrow && <ChevronRight className="w-5 h-5 text-gray-400" />}
      </div>
    </motion.button>
  );
};

export const HelpSupportPage: React.FC<HelpSupportPageProps> = () => {
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [feedbackText, setFeedbackText] = useState("");

  const handleReportSubmit = () => {
    // Here you would submit the report
    console.log("Report submitted:", { reportType, reportDescription });
    setReportDescription("");
    setReportType("");
    setShowReportModal(false);
  };

  const handleFeedbackSubmit = () => {
    // Here you would submit the feedback
    console.log("Feedback submitted:", feedbackText);
    setFeedbackText("");
    setShowFeedbackModal(false);
  };

  const reportTypes = [
    { id: "bug", label: "Bug Report", icon: Bug },
    { id: "feature", label: "Feature Request", icon: Star },
    { id: "account", label: "Account Issue", icon: Shield },
    { id: "other", label: "Other", icon: MessageCircle },
  ];

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <Header
          title="Help & Support"
          showBack
          onBack={() => navigate("/app/settings")}
        />

        <div className="px-4 pt-4 pb-20">
          {/* Help Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm mb-6"
          >
            <div className="px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Help Resources
              </h3>
            </div>
            <div>
              <SettingsRow
                icon={HelpCircle}
                label="FAQ"
                subtitle="Frequently asked questions"
                onPress={() =>
                  window.open("https://help.hola-app.com/faq", "_blank")
                }
                external
                showArrow
              />
              <SettingsRow
                icon={FileText}
                label="User Guide"
                subtitle="Learn how to use Hola effectively"
                onPress={() =>
                  window.open("https://help.hola-app.com/guide", "_blank")
                }
                external
                showArrow
              />
              <SettingsRow
                icon={MessageSquare}
                label="Community Forum"
                subtitle="Connect with other users"
                onPress={() =>
                  window.open("https://community.hola-app.com", "_blank")
                }
                external
                showArrow
              />
            </div>
          </motion.div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm mb-6"
          >
            <div className="px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Contact Support
              </h3>
            </div>
            <div>
              <SettingsRow
                icon={Mail}
                label="Email Support"
                subtitle="Get help via email"
                onPress={() => setShowContactModal(true)}
                showArrow
              />
              <SettingsRow
                icon={MessageSquare}
                label="Live Chat"
                subtitle="Chat with our support team"
                onPress={() => setShowContactModal(true)}
                showArrow
              />
              <SettingsRow
                icon={Phone}
                label="Phone Support"
                subtitle="Call us for urgent issues"
                onPress={() => setShowContactModal(true)}
                showArrow
              />
            </div>
          </motion.div>

          {/* Feedback & Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm mb-6"
          >
            <div className="px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Feedback & Reports
              </h3>
            </div>
            <div>
              <SettingsRow
                icon={Bug}
                label="Report a Problem"
                subtitle="Let us know about bugs or issues"
                onPress={() => setShowReportModal(true)}
                showArrow
              />
              <SettingsRow
                icon={Star}
                label="Send Feedback"
                subtitle="Share your thoughts and suggestions"
                onPress={() => setShowFeedbackModal(true)}
                showArrow
              />
              <SettingsRow
                icon={Star}
                label="Rate Hola"
                subtitle="Rate us on the app store"
                onPress={() =>
                  window.open("https://apps.apple.com/app/hola", "_blank")
                }
                external
                showArrow
              />
            </div>
          </motion.div>

          {/* Legal & Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm mb-6"
          >
            <div className="px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Legal & Privacy
              </h3>
            </div>
            <div>
              <SettingsRow
                icon={FileText}
                label="Terms of Service"
                onPress={() =>
                  window.open("https://hola-app.com/terms", "_blank")
                }
                external
                showArrow
              />
              <SettingsRow
                icon={Shield}
                label="Privacy Policy"
                onPress={() =>
                  window.open("https://hola-app.com/privacy", "_blank")
                }
                external
                showArrow
              />
              <SettingsRow
                icon={Info}
                label="About Hola"
                subtitle="Version 2.1.0"
                showArrow
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Support Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Contact Support"
      >
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Choose how you'd like to get in touch with our support team:
          </p>

          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() =>
                window.open("mailto:support@hola-app.com", "_blank")
              }
            >
              <Mail className="w-5 h-5 mr-3" />
              Email: support@hola-app.com
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => window.open("https://chat.hola-app.com", "_blank")}
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              Live Chat (9 AM - 6 PM EST)
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => window.open("tel:+1-555-HOLA-APP", "_blank")}
            >
              <Phone className="w-5 h-5 mr-3" />
              Phone: +1 (555) HOLA-APP
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Problem Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report a Problem"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Problem Type
            </label>
            <div className="space-y-2">
              {reportTypes.map((type) => (
                <motion.button
                  key={type.id}
                  onClick={() => setReportType(type.id)}
                  className={`w-full flex items-center p-3 rounded-lg border transition-colors ${
                    reportType === type.id
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <type.icon className="w-5 h-5 mr-3 text-gray-600" />
                  <span className="font-medium">{type.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Please describe the issue you're experiencing..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowReportModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportSubmit}
              disabled={!reportType || !reportDescription.trim()}
              className="flex-1"
            >
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Send Feedback"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            We'd love to hear your thoughts, suggestions, or feature requests!
          </p>

          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Share your feedback with us..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-black focus:border-black"
          />

          <div className="flex space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowFeedbackModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFeedbackSubmit}
              disabled={!feedbackText.trim()}
              className="flex-1"
            >
              Send Feedback
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
