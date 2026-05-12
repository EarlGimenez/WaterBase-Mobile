import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert, Image, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import { SearchableLocationSelect } from "../components/ui/SearchableLocationSelect";
import { OrganizationSelect } from "../components/ui/OrganizationSelect";
import Navigation from "../components/Navigation";
import { API_ENDPOINTS, apiRequest, getImageUrl } from "../config/api";
import { toTitleCaseInput } from "../utils/textFormat";

const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_DOCUMENT_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const ACCEPTED_DOCUMENT_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const DOCUMENT_TEMPLATE_PATHS = {
  ngo: {
    sec_certificate: "/storage/document-templates/ngo/NGO Certificate of Incorporation.png",
    articles_bylaws: "/storage/document-templates/ngo/NGO SEC Business Registration.jpg",
    representative_authorization: "/storage/document-templates/ngo/NGO Authorization Letter.png",
  },
  lgu: {
    representative_id: "/storage/document-templates/lgu/LGU Official ID.jpg",
    designation_letter: "/storage/document-templates/lgu/LGU Authorization Letter.png",
    endorsement_letter: "/storage/document-templates/lgu/LGU Endorsement Letter.png",
  },
  researcher: {
    institution_id: "/storage/document-templates/researcher/Researcher School ID.jpg",
    endorsement_letter: "/storage/document-templates/researcher/Researcher Authorization Letter.png",
    research_proof: "/storage/document-templates/researcher/Researcher Ethics Clearance.png",
  },
} as const;

const ROLE_DOCUMENTS = {
  ngo: [
    {
      key: "sec_certificate",
      name: "SEC Certificate of Registration / Incorporation",
      description: "Proves the NGO is legally registered with the SEC.",
    },
    {
      key: "articles_bylaws",
      name: "Articles of Incorporation and By-Laws",
      description: "Shows the organization's purpose, structure, and operating rules.",
    },
    {
      key: "representative_authorization",
      name: "Representative Authorization",
      description: "Confirms the registrant is authorized to represent the organization.",
    },
  ],
  lgu: [
    {
      key: "representative_id",
      name: "Official LGU Employee ID or Government ID",
      description: "Verifies the representative's identity and LGU affiliation.",
    },
    {
      key: "designation_letter",
      name: "Authorization, Office Order, or Designation Letter",
      description: "Confirms the LGU assigned the representative to register.",
    },
    {
      key: "endorsement_letter",
      name: "Official Request or Endorsement Letter",
      description: "Shows official LGU intent using LGU letterhead.",
    },
  ],
  researcher: [
    {
      key: "institution_id",
      name: "Valid School, Institutional, or Employee ID",
      description: "Verifies the researcher's institutional identity.",
    },
    {
      key: "endorsement_letter",
      name: "Endorsement Letter",
      description: "Confirms support from an adviser, department, institution, or research office.",
    },
    {
      key: "research_proof",
      name: "Research Proposal, Ethics Clearance, or Affiliation Proof",
      description: "Shows the research purpose or formal research affiliation.",
    },
  ],
} as const;

type VerificationRole = keyof typeof ROLE_DOCUMENTS;
type RegistrationDocument = typeof ROLE_DOCUMENTS[VerificationRole][number];
type DocumentFiles = Partial<Record<string, DocumentPicker.DocumentPickerAsset>>;
type DocumentErrors = Partial<Record<string, string>>;

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    organization: "",
    areaOfResponsibility: "",
    role: "volunteer",
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [documentFiles, setDocumentFiles] = useState<DocumentFiles>({});
  const [documentErrors, setDocumentErrors] = useState<DocumentErrors>({});
  const [selectedTemplateDocument, setSelectedTemplateDocument] = useState<RegistrationDocument | null>(null);

  const roles = [
    { value: "volunteer", label: "Volunteer", description: "Individual community volunteer" },
    { value: "ngo", label: "NGO Member", description: "Non-governmental organization representative" },
    { value: "lgu", label: "LGU Official", description: "Local government unit official" },
    { value: "researcher", label: "Researcher", description: "Academic or environmental researcher" },
  ];

  const shouldShowOrganizationFields = (role: string) => {
    return ['ngo', 'lgu'].includes(role);
  };

  const getRoleDocuments = (role: string): readonly RegistrationDocument[] => {
    return ROLE_DOCUMENTS[role as VerificationRole] ?? [];
  };

  const getTemplatePath = (role: string, documentKey?: string) => {
    if (!documentKey) return null;

    return DOCUMENT_TEMPLATE_PATHS[role as VerificationRole]?.[documentKey as keyof typeof DOCUMENT_TEMPLATE_PATHS[VerificationRole]] ?? null;
  };

  const requiresRegistrationDocuments = getRoleDocuments(formData.role).length > 0;

  const validateDocumentFile = (file: DocumentPicker.DocumentPickerAsset) => {
    const lowerName = file.name.toLowerCase();
    const hasValidType = !!file.mimeType && ACCEPTED_DOCUMENT_MIME_TYPES.includes(file.mimeType);
    const hasValidExtension = ACCEPTED_DOCUMENT_EXTENSIONS.some((extension) => lowerName.endsWith(extension));

    if (!hasValidType && !hasValidExtension) {
      return "Invalid file format. Upload a PDF, JPG, JPEG, or PNG file.";
    }

    if (file.size && file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return "File is too large. Maximum allowed size is 10MB.";
    }

    return "";
  };

  const pickRegistrationDocument = async (documentKey: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/png", "image/jpeg", "image/jpg"],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const validationError = validateDocumentFile(file);
        setDocumentErrors((current) => ({ ...current, [documentKey]: validationError }));

        if (validationError) {
          setDocumentFiles((current) => {
            const next = { ...current };
            delete next[documentKey];
            return next;
          });
          setError(validationError);
          return;
        }

        setDocumentFiles((current) => ({ ...current, [documentKey]: file }));
        setError("");
      }
    } catch (err) {
      console.error("Document picker error:", err);
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("Please agree to the terms and conditions.");
      return;
    }

    // Additional validation for organization fields
    if (shouldShowOrganizationFields(formData.role) && !formData.organization) {
      setError("Organization name is required for this role.");
      return;
    }

    if (shouldShowOrganizationFields(formData.role) && !formData.areaOfResponsibility) {
      setError("Area of responsibility is required for NGOs and LGUs.");
      return;
    }

    if (requiresRegistrationDocuments) {
      const missingDocument = getRoleDocuments(formData.role).find((document) => !documentFiles[document.key]);
      if (missingDocument) {
        setError(`${missingDocument.name} is required for ${formData.role.toUpperCase()} registration.`);
        return;
      }

      const invalidDocument = getRoleDocuments(formData.role).find((document) => documentErrors[document.key]);
      if (invalidDocument) {
        setError(documentErrors[invalidDocument.key] || "Please fix document upload errors before continuing.");
        return;
      }
    }

    // Phone number validation
    if (!formData.phoneNumber) {
      setError("Phone number is required.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let requestBody: FormData | string;

      if (requiresRegistrationDocuments || shouldShowOrganizationFields(formData.role)) {
        const formDataBody = new FormData();
        formDataBody.append("firstName", formData.firstName);
        formDataBody.append("lastName", formData.lastName);
        formDataBody.append("email", formData.email);
        formDataBody.append("password", formData.password);
        formDataBody.append("password_confirmation", formData.confirmPassword);
        formDataBody.append("phoneNumber", formData.phoneNumber);
        formDataBody.append("role", formData.role);
        if (shouldShowOrganizationFields(formData.role)) {
          formDataBody.append("organization", formData.organization);
          formDataBody.append("areaOfResponsibility", formData.areaOfResponsibility);
        }
        getRoleDocuments(formData.role).forEach((document) => {
          const file = documentFiles[document.key];
          if (file) {
            formDataBody.append(`registration_documents[${document.key}]`, {
              uri: file.uri,
              name: file.name,
              type: file.mimeType || "application/octet-stream",
            } as any);
          }
        });
        requestBody = formDataBody;
      } else {
        requestBody = JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
          phoneNumber: formData.phoneNumber,
          role: formData.role,
          organization: shouldShowOrganizationFields(formData.role) ? formData.organization : null,
          areaOfResponsibility: shouldShowOrganizationFields(formData.role) ? formData.areaOfResponsibility : null,
        });
      }

      console.log("Registration data:", requestBody);

      // Make actual API call to WaterBase backend using mobile-compatible URL
      const response = await apiRequest(API_ENDPOINTS.REGISTER, {
        method: "POST",
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Backend validation errors:", errorData.errors);
        
        // Handle validation errors specifically
        if (errorData.errors) {
          const firstError = Object.values(errorData.errors)[0];
          throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
        }
        
        throw new Error(errorData.message || `Registration failed (${response.status})`);
      }

      const data = await response.json();
      console.log("Registration successful:", data);

      Alert.alert(
        "Registration Successful",
        requiresRegistrationDocuments
          ? "Your account has been created successfully and is pending admin review. You will be able to log in once approved."
          : "Your account has been created successfully! Please check your email for verification.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login" as never),
          },
        ]
      );
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          setError("Cannot connect to server. Please check if the Laravel backend is running and accessible from your mobile device.");
        } else {
          setError(error.message);
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation title="Create Account" showBackButton={true} />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          <Card className="border-waterbase-200 shadow-lg">
            <CardHeader className="items-center">
              <LinearGradient
                colors={['#0ea5e9', '#22c55e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
              >
                <Ionicons name="person-add" size={32} color="white" />
              </LinearGradient>
              <CardTitle className="text-2xl text-center text-waterbase-950 mb-2">
                Join WaterbasePH
              </CardTitle>
              <Text className="text-center text-waterbase-600 px-4 leading-relaxed">
                Create your account to start reporting pollution, participate in cleanups, and help protect our water resources
              </Text>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              {/* Error Alert */}
              {error ? (
                <View className="bg-red-50 border border-red-200 rounded-lg p-4 flex-row items-start mb-6">
                  <Ionicons name="alert-circle" size={20} color="#dc2626" />
                  <Text className="ml-3 text-red-700 text-sm flex-1">{error}</Text>
                </View>
              ) : null}

              {/* Personal Information */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-waterbase-950 mb-4">
                  Personal Information
                </Text>
                
                <View className="flex-row space-x-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-waterbase-700 mb-2">
                      First Name *
                    </Text>
                    <TextInput
                      value={formData.firstName}
                      onChangeText={(text) => setFormData({ ...formData, firstName: toTitleCaseInput(text) })}
                      placeholder="Enter first name"
                      editable={!isLoading}
                      className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                      style={{ fontSize: 16, lineHeight: 20 }}
                    />
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-waterbase-700 mb-2">
                      Last Name *
                    </Text>
                    <TextInput
                      value={formData.lastName}
                      onChangeText={(text) => setFormData({ ...formData, lastName: toTitleCaseInput(text) })}
                      placeholder="Enter last name"
                      editable={!isLoading}
                      className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                      style={{ fontSize: 16, lineHeight: 20 }}
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-waterbase-700 mb-2">
                    Email Address *
                  </Text>
                  <TextInput
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                    className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                    style={{ fontSize: 16, lineHeight: 20 }}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-waterbase-700 mb-2">
                    Phone Number
                  </Text>
                  <TextInput
                    value={formData.phoneNumber}
                    onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    editable={!isLoading}
                    className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                    style={{ fontSize: 16, lineHeight: 20 }}
                  />
                </View>

                <View className="flex-row space-x-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-waterbase-700 mb-2">
                      Password *
                    </Text>
                    <TextInput
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      placeholder="Enter password"
                      secureTextEntry
                      editable={!isLoading}
                      className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                      style={{ fontSize: 16, lineHeight: 20 }}
                    />
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-waterbase-700 mb-2">
                      Confirm Password *
                    </Text>
                    <TextInput
                      value={formData.confirmPassword}
                      onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                      placeholder="Confirm password"
                      secureTextEntry
                      editable={!isLoading}
                      className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                      style={{ fontSize: 16, lineHeight: 20 }}
                    />
                  </View>
                </View>
              </View>

              {/* Role Selection */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-waterbase-950 mb-4">
                  Role Information
                </Text>
                
                <Text className="text-sm font-medium text-waterbase-700 mb-3">
                  I am registering as a: *
                </Text>
                
                <View className="space-y-2 mb-4">
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.value}
                      onPress={() => {
                        setFormData({ ...formData, role: role.value });
                        setDocumentFiles({});
                        setDocumentErrors({});
                      }}
                      disabled={isLoading}
                      className={`border rounded-lg px-4 py-3 ${
                        formData.role === role.value
                          ? 'border-waterbase-500 bg-waterbase-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View className={`w-5 h-5 rounded-full border-2 mr-3 ${
                          formData.role === role.value
                            ? 'border-waterbase-500 bg-waterbase-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.role === role.value && (
                            <View className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-waterbase-900 text-base font-medium">
                            {role.label}
                          </Text>
                          <Text className="text-waterbase-600 text-sm mt-1">
                            {role.description}
                          </Text>
                          {(shouldShowOrganizationFields(role.value) || getRoleDocuments(role.value).length > 0) && (
                            <Text className="text-waterbase-500 text-xs mt-1">
                              Requires verification documents
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {shouldShowOrganizationFields(formData.role) && (
                  <>
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-waterbase-700 mb-2">
                        Organization/Agency *
                      </Text>
                      <OrganizationSelect
                        value={formData.organization}
                        onValueChange={(value) => setFormData({ ...formData, organization: value })}
                        placeholder="Select your organization"
                        disabled={isLoading}
                        className="w-full"
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-sm font-medium text-waterbase-700 mb-2">
                        Area of Responsibility *
                      </Text>
                      <SearchableLocationSelect
                        value={formData.areaOfResponsibility}
                        onValueChange={(value) => setFormData({ ...formData, areaOfResponsibility: value })}
                        placeholder="Search for your area of responsibility..."
                        className="w-full"
                      />
                      <Text className="text-xs text-waterbase-500 mt-1">
                        Search for the region, province, city, municipality, or barangay you are responsible for
                      </Text>
                    </View>
                  </>
                )}

                {requiresRegistrationDocuments && (
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-waterbase-700 mb-2">
                      Required Documents *
                    </Text>
                    <Text className="text-xs text-waterbase-500 mb-3">
                      Upload all role-based documents. Accepted formats: PDF, JPG, JPEG, PNG. Max size: 10MB each.
                    </Text>

                    <View className="space-y-3">
                      {getRoleDocuments(formData.role).map((document) => {
                        const file = documentFiles[document.key];
                        const isImage = !!file?.mimeType?.startsWith("image/");

                        return (
                          <View key={document.key} className="border border-waterbase-100 rounded-lg bg-white p-3">
                            <Text className="text-sm font-semibold text-waterbase-950">
                              {document.name}
                            </Text>
                            <Text className="text-xs text-waterbase-600 mt-1 mb-3">
                              {document.description}
                            </Text>

                            {file ? (
                              <View className="flex-row items-center bg-waterbase-50 rounded-lg p-2 mb-3">
                                {isImage ? (
                                  <Image source={{ uri: file.uri }} className="w-12 h-12 rounded-md mr-3" resizeMode="cover" />
                                ) : (
                                  <View className="w-12 h-12 rounded-md mr-3 bg-white border border-waterbase-100 items-center justify-center">
                                    <Ionicons name="document-text" size={24} color="#0ea5e9" />
                                  </View>
                                )}
                                <View className="flex-1">
                                  <Text className="text-sm text-waterbase-900" numberOfLines={1}>
                                    {file.name}
                                  </Text>
                                  {file.size ? (
                                    <Text className="text-xs text-waterbase-600">
                                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </Text>
                                  ) : null}
                                </View>
                              </View>
                            ) : null}

                            {documentErrors[document.key] ? (
                              <Text className="text-xs text-red-600 mb-2">{documentErrors[document.key]}</Text>
                            ) : null}

                            <View className="flex-row space-x-2">
                              <TouchableOpacity
                                onPress={() => pickRegistrationDocument(document.key)}
                                disabled={isLoading}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-3 bg-white flex-row items-center justify-center"
                              >
                                <Ionicons name={file ? "refresh" : "attach"} size={18} color="#6B7280" />
                                <Text className="ml-2 text-sm text-waterbase-900">
                                  {file ? "Replace" : "Upload"}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => setSelectedTemplateDocument(document)}
                                disabled={isLoading}
                                className="flex-1 border border-waterbase-200 rounded-lg px-3 py-3 bg-waterbase-50 flex-row items-center justify-center"
                              >
                                <Ionicons name="eye" size={18} color="#0ea5e9" />
                                <Text className="ml-2 text-sm text-waterbase-700">
                                  View Template
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* Terms and Conditions */}
              <View className="mb-6">
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, agreeToTerms: !formData.agreeToTerms })}
                  disabled={isLoading}
                  className="flex-row items-start"
                >
                  <View className={`w-5 h-5 border-2 rounded mr-3 mt-0.5 ${
                    formData.agreeToTerms ? 'border-waterbase-500 bg-waterbase-500' : 'border-gray-300'
                  }`}>
                    {formData.agreeToTerms && (
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    )}
                  </View>
                  <Text className="flex-1 text-sm text-waterbase-700 leading-relaxed">
                    I agree to the{" "}
                    <Text className="text-waterbase-600 underline">Terms of Service</Text>
                    {" "}and{" "}
                    <Text className="text-waterbase-600 underline">Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading || (requiresRegistrationDocuments && getRoleDocuments(formData.role).some((document) => !documentFiles[document.key] || documentErrors[document.key]))}
                className="w-full rounded-lg mb-4"
              >
                <LinearGradient
                  colors={['#0ea5e9', '#22c55e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-4 rounded-lg flex-row items-center justify-center"
                >
                  {isLoading && (
                    <View className="mr-2">
                      <Ionicons name="refresh" size={20} color="white" />
                    </View>
                  )}
                  <Text className="text-white font-semibold text-center text-base">
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Login Link */}
              <View className="flex-row justify-center">
                <Text className="text-waterbase-600 text-sm">
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate("Login" as never)}
                  disabled={isLoading}
                >
                  <Text className="text-waterbase-500 font-semibold text-sm underline">
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedTemplateDocument}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedTemplateDocument(null)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-2xl p-5">
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-1 mr-3">
                <Text className="text-lg font-semibold text-waterbase-950">
                  {selectedTemplateDocument?.name}
                </Text>
                <Text className="text-sm text-waterbase-600 mt-1">
                  Sample document template for this role and document type.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedTemplateDocument(null)}>
                <Ionicons name="close" size={24} color="#334155" />
              </TouchableOpacity>
            </View>

            <View className="border border-dashed border-waterbase-200 rounded-xl bg-waterbase-50 h-64 items-center justify-center px-4">
              {getImageUrl(getTemplatePath(formData.role, selectedTemplateDocument?.key)) ? (
                <Image
                  source={{ uri: getImageUrl(getTemplatePath(formData.role, selectedTemplateDocument?.key)) || undefined }}
                  className="w-full h-full rounded-lg"
                  resizeMode="contain"
                />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={72} color="#0ea5e9" />
                  <Text className="text-waterbase-900 font-semibold mt-3">
                    Template preview unavailable
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default RegisterScreen;
