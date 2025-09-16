import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { ChartData } from '../utils/wbsiCalculator';
import {
    getWBSIInterpretation,
    findMatchingScenarios,
    getScenarioInsights,
    generateSummaryReport,
    CHART_INTERPRETATION_GUIDE,
    WBSI_SCENARIOS
} from '../utils/wbsiScenarios';

interface SeverityDistributionChartProps {
    chartData: ChartData;
    className?: string;
    locationName?: string;
}

export const SeverityDistributionChart: React.FC<SeverityDistributionChartProps> = ({
    chartData,
    className,
    locationName
}) => {
    const { bar_data, kde_data, config, outliers } = chartData;
    const [activeTab, setActiveTab] = useState("overview");
    const [isExpanded, setIsExpanded] = useState(false);

    // Decide on displayed WBSI: Use shrunk if small n_reports
    const useShrunk = config.n_reports < 10;  // Threshold for small samples
    const displayedWBSI = useShrunk ? config.wbsi_display_shrunk : config.wbsi_display;

    // Get comprehensive analysis
    const interpretation = getWBSIInterpretation(displayedWBSI, config.consensus_percentage / 100, config.n_reports);
    const matchingScenarios = findMatchingScenarios(displayedWBSI, config.consensus_percentage / 100);
    const insights = getScenarioInsights(displayedWBSI, config.consensus_percentage / 100, config.n_reports, outliers.length);
    const summaryReport = generateSummaryReport(displayedWBSI, config.consensus_percentage / 100, config.n_reports, outliers.length, config.is_polymodal);

    // Get severity band color
    const getSeverityBandColor = (band: string): string => {
        switch (band.toLowerCase()) {
            case 'low':
                return '#10b981'; // green-500
            case 'medium':
                return '#f59e0b'; // yellow-500
            case 'high':
                return '#f97316'; // orange-500
            case 'critical':
                return '#ef4444'; // red-500
            default:
                return '#6b7280'; // gray-500
        }
    };

    const severityDescription = React.useMemo(() => {
        const wbsi = displayedWBSI;
        if (wbsi < 25) {
            return {
                level: "Low Pollution",
                description: "Water quality is generally acceptable with minimal pollution concerns.",
                color: "text-green-600",
                bgColor: "bg-green-50",
                borderColor: "border-green-200"
            };
        } else if (wbsi < 50) {
            return {
                level: "Medium Pollution",
                description: "Moderate pollution levels detected. Regular monitoring recommended.",
                color: "text-yellow-600",
                bgColor: "bg-yellow-50",
                borderColor: "border-yellow-200"
            };
        } else if (wbsi < 75) {
            return {
                level: "High Pollution",
                description: "Significant pollution detected. Immediate attention and action required.",
                color: "text-orange-600",
                bgColor: "bg-orange-50",
                borderColor: "border-orange-200"
            };
        } else {
            return {
                level: "Critical Pollution",
                description: "Severe pollution levels. Urgent intervention and cleanup required.",
                color: "text-red-600",
                bgColor: "bg-red-50",
                borderColor: "border-red-200"
            };
        }
    }, [displayedWBSI]);

    const TabButton = ({ id, title, icon, isActive, onPress }: {
        id: string;
        title: string;
        icon: string;
        isActive: boolean;
        onPress: () => void;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-1 py-2 px-1 rounded-lg items-center ${isActive ? 'bg-waterbase-500' : 'bg-gray-100'
                }`}
        >
            <Ionicons
                name={icon as any}
                size={14}
                color={isActive ? 'white' : '#6b7280'}
            />
            <Text className={`text-xs mt-1 text-center ${isActive ? 'text-white' : 'text-gray-600'
                }`}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    const renderDistributionBars = () => {
        const maxCount = Math.max(...bar_data.map((d: any) => d.count));

        return (
            <View className="space-y-2">
                <Text className="text-sm font-medium text-gray-700 mb-3">Report Distribution</Text>
                {bar_data.map((item: any, index: number) => (
                    <View key={index} className="flex-row items-center">
                        <Text className="text-xs text-gray-600 w-12">{item.severity}%</Text>
                        <View className="flex-1 mx-2">
                            <View
                                className="bg-blue-500 h-4 rounded"
                                style={{
                                    width: `${(item.count / maxCount) * 100}%`,
                                    minWidth: item.count > 0 ? 8 : 0
                                }}
                            />
                        </View>
                        <Text className="text-xs text-gray-600 w-8 text-right">{item.count}</Text>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <Card className={`w-full ${className}`}>
            <CardHeader className="pb-2">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <Ionicons name="trending-up" size={16} color="#0d7377" />
                        <Text className="text-sm font-semibold text-waterbase-950 ml-2 flex-1">
                            Pollution Analysis
                            {locationName && (
                                <Text className="text-xs text-gray-500"> ({locationName})</Text>
                            )}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setIsExpanded(!isExpanded)}
                        className="p-1"
                    >
                        <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={16}
                            color="#6b7280"
                        />
                    </TouchableOpacity>
                </View>

                {/* Quick WBSI Score - Always visible */}
                <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center space-x-2">
                        <Badge
                            variant="outline"
                            className={`text-xs ${severityDescription.color}`}
                        >
                            WBSI: {displayedWBSI}%
                        </Badge>
                        <Text className="text-xs text-gray-600">
                            {config.n_reports} reports, {config.consensus_percentage}% consensus
                        </Text>
                    </View>
                    {useShrunk && (
                        <Text className="text-xs text-gray-500 italic">
                            (Adjusted for small sample; raw: {config.wbsi_display}%)
                        </Text>
                    )}
                </View>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-0">
                    {/* Tab Navigation */}
                    <View className="flex-row space-x-1 mb-4 bg-gray-50 p-1 rounded-lg">
                        <TabButton
                            id="overview"
                            title="Overview"
                            icon="eye"
                            isActive={activeTab === "overview"}
                            onPress={() => setActiveTab("overview")}
                        />
                        <TabButton
                            id="distribution"
                            title="Distribution"
                            icon="bar-chart"
                            isActive={activeTab === "distribution"}
                            onPress={() => setActiveTab("distribution")}
                        />
                        <TabButton
                            id="summary"
                            title="Summary"
                            icon="document-text"
                            isActive={activeTab === "summary"}
                            onPress={() => setActiveTab("summary")}
                        />
                        <TabButton
                            id="insights"
                            title="Insights"
                            icon="bulb"
                            isActive={activeTab === "insights"}
                            onPress={() => setActiveTab("insights")}
                        />
                    </View>

                    <ScrollView
                        className="max-h-96"
                        showsVerticalScrollIndicator={false}
                    >
                        {activeTab === "overview" && (
                            <View className="space-y-4">
                                {/* WBSI Score Display */}
                                <View className={`p-3 rounded-lg border ${severityDescription.bgColor} ${severityDescription.borderColor}`}>
                                    <View className="flex-row items-center justify-between mb-2">
                                        <View className="flex-row items-center">
                                            <Ionicons name="radio-button-on" size={16} color="#0d7377" />
                                            <Text className="font-semibold text-sm ml-2">{interpretation.level}</Text>
                                        </View>
                                        <Badge variant="outline" className={severityDescription.color}>
                                            {displayedWBSI}%
                                        </Badge>
                                    </View>

                                    <View className="space-y-2">
                                        <Text className="text-xs text-gray-700">
                                            {summaryReport.overall}
                                        </Text>
                                        <Text className="text-xs text-gray-600">
                                            {summaryReport.reliability}
                                        </Text>
                                    </View>
                                </View>

                                {/* Quick Stats */}
                                <View className="space-y-2">
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-xs text-gray-600">Peak Severity:</Text>
                                        <Text className="text-xs font-medium">{config.peak_severity}%</Text>
                                    </View>
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-xs text-gray-600">Community Agreement:</Text>
                                        <Text className="text-xs font-medium">{config.consensus_percentage}%</Text>
                                    </View>
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-xs text-gray-600">Total Reports:</Text>
                                        <Text className="text-xs font-medium">{config.n_reports}</Text>
                                    </View>
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-xs text-gray-600">Unusual Reports:</Text>
                                        <Text className="text-xs font-medium">{outliers.length}</Text>
                                    </View>
                                </View>

                                {/* Action Priority */}
                                <View className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <View className="flex-row items-center mb-1">
                                        <Ionicons name="warning" size={16} color="#2563eb" />
                                        <Text className="font-semibold text-sm text-blue-800 ml-2">Action Required</Text>
                                    </View>
                                    <Text className="text-xs text-blue-700">{summaryReport.recommendation}</Text>
                                </View>

                                {/* Warnings */}
                                {config.is_polymodal && (
                                    <View className="flex-row items-start p-2 bg-yellow-50 border border-yellow-200 rounded">
                                        <Ionicons name="warning" size={14} color="#d97706" className="mt-0.5" />
                                        <View className="ml-2 flex-1">
                                            <Text className="font-medium text-xs text-yellow-800">Split Community Opinion</Text>
                                            <Text className="text-xs text-yellow-700 mt-1">
                                                Multiple severity peaks detected. Investigation needed to understand disagreement.
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === "distribution" && (
                            <View className="space-y-4">
                                {/* Simple Bar Chart Visualization */}
                                {renderDistributionBars()}

                                {/* Chart Interpretation */}
                                <View className="space-y-3">
                                    <Text className="text-sm font-medium text-gray-800">How to Read This Chart</Text>
                                    <View className="space-y-2">
                                        <View className="flex-row items-center">
                                            <View className="w-3 h-3 bg-blue-500 rounded mr-2" />
                                            <Text className="text-xs text-gray-600 flex-1">
                                                Blue bars: Number of reports at each pollution level
                                            </Text>
                                        </View>
                                        <Text className="text-xs text-gray-600">
                                            Peak severity: {config.peak_severity}% (most commonly reported level)
                                        </Text>
                                        <Text className="text-xs text-gray-600">
                                            Consensus range: {config.consensus_range[0]}% - {config.consensus_range[1]}%
                                        </Text>
                                    </View>
                                </View>

                                {/* Severity Bands */}
                                <View className="space-y-2">
                                    <Text className="text-sm font-medium text-gray-700">Pollution Level Breakdown</Text>
                                    <View className="space-y-2">
                                        {Object.entries(config.severity_bands).map(([band, percentage]) => (
                                            <View key={band} className="flex-row items-center justify-between p-2 bg-gray-50 rounded">
                                                <View className="flex-row items-center">
                                                    <View
                                                        className="w-3 h-3 rounded-full mr-2"
                                                        style={{ backgroundColor: getSeverityBandColor(band) }}
                                                    />
                                                    <Text className="capitalize text-xs text-gray-700 font-medium">{band}</Text>
                                                </View>
                                                <Text className="text-xs font-semibold">{(percentage as number).toFixed(1)}%</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}

                        {activeTab === "summary" && (
                            <View className="space-y-4">
                                {/* Executive Summary */}
                                <View className="space-y-3">
                                    <View className="flex-row items-center">
                                        <Ionicons name="document-text" size={16} color="#0d7377" />
                                        <Text className="text-sm font-semibold text-gray-800 ml-2">Executive Summary</Text>
                                    </View>

                                    <View className={`p-3 rounded-lg border ${interpretation.bgColor} ${interpretation.borderColor}`}>
                                        <View className="space-y-2">
                                            <Text className="text-xs font-medium">{summaryReport.overall}</Text>
                                            <Text className="text-xs">{summaryReport.reliability}</Text>
                                            <Text className="text-xs font-medium mt-2">{summaryReport.recommendation}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Next Steps */}
                                <View className="space-y-3">
                                    <Text className="text-sm font-semibold text-gray-800">Recommended Next Steps</Text>
                                    <View className="space-y-2">
                                        {summaryReport.nextSteps.map((step: string, index: number) => (
                                            <View key={index} className="flex-row items-start">
                                                <Text className="text-waterbase-600 font-bold mr-2 text-xs">{index + 1}.</Text>
                                                <Text className="text-xs text-gray-700 flex-1">{step}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Key Insights */}
                                {insights.length > 0 && (
                                    <View className="space-y-3">
                                        <Text className="text-sm font-semibold text-gray-800">Key Insights</Text>
                                        <View className="space-y-2">
                                            {insights.map((insight: string, index: number) => (
                                                <View key={index} className="p-2 bg-blue-50 rounded">
                                                    <Text className="text-xs text-gray-700">{insight}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === "insights" && (
                            <View className="space-y-4">
                                {/* Chart Guide */}
                                <View className="space-y-3">
                                    <View className="flex-row items-center">
                                        <Ionicons name="help-circle" size={16} color="#0d7377" />
                                        <Text className="text-sm font-semibold text-gray-800 ml-2">Understanding Your Results</Text>
                                    </View>

                                    {Object.entries(CHART_INTERPRETATION_GUIDE).map(([key, guide]: [string, any]) => (
                                        <View key={key} className="p-3 bg-gray-50 rounded-lg">
                                            <Text className="text-sm font-medium text-gray-800 mb-1">{guide.title}</Text>
                                            <Text className="text-xs text-gray-600 mb-2">{guide.description}</Text>
                                            <View className="space-y-1">
                                                {guide.interpretation.map((item: string, index: number) => (
                                                    <View key={index} className="flex-row items-start">
                                                        <Text className="text-waterbase-600 mr-1 text-xs">•</Text>
                                                        <Text className="text-xs text-gray-700 flex-1">{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                {/* Matching Scenarios */}
                                {matchingScenarios.length > 0 && (
                                    <View className="space-y-3">
                                        <Text className="text-sm font-semibold text-gray-800">Similar Situations</Text>
                                        {matchingScenarios.map((scenario: any, index: number) => (
                                            <View key={scenario.id} className="p-3 border rounded-lg">
                                                <View className="flex-row items-center justify-between mb-2">
                                                    <Text className="text-sm font-medium text-gray-800 flex-1">{scenario.title}</Text>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${scenario.urgency === 'low' ? 'text-green-600' :
                                                                scenario.urgency === 'medium' ? 'text-yellow-600' :
                                                                    scenario.urgency === 'high' ? 'text-orange-600' :
                                                                        'text-red-600'
                                                            }`}
                                                    >
                                                        {scenario.urgency}
                                                    </Badge>
                                                </View>
                                                <Text className="text-xs text-gray-600 mb-2">{scenario.description}</Text>
                                                <Text className="text-xs text-gray-700 mb-2">{scenario.interpretation}</Text>
                                                <View className="bg-blue-50 p-2 rounded">
                                                    <Text className="text-xs">
                                                        <Text className="font-medium text-blue-800">Recommendation: </Text>
                                                        <Text className="text-blue-700">{scenario.actionRecommendation}</Text>
                                                    </Text>
                                                </View>
                                                <Text className="text-xs text-gray-500 mt-2">
                                                    <Text className="font-medium">Real-world example:</Text> {scenario.realWorldExample}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* General Guidance */}
                                <View className="p-3 bg-waterbase-50 border border-waterbase-200 rounded-lg">
                                    <Text className="text-sm font-medium text-waterbase-800 mb-2">💡 Pro Tips</Text>
                                    <View className="space-y-1">
                                        <Text className="text-xs text-waterbase-700">• Higher consensus (&gt;70%) means more reliable results</Text>
                                        <Text className="text-xs text-waterbase-700">• More reports (&gt;10) provide better statistical confidence</Text>
                                        <Text className="text-xs text-waterbase-700">• Outliers may indicate special conditions worth investigating</Text>
                                        <Text className="text-xs text-waterbase-700">• Split peaks suggest complex pollution patterns</Text>
                                        <Text className="text-xs text-waterbase-700">• Consider seasonal variations when planning actions</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </CardContent>
            )}
        </Card>
    );
};

export default SeverityDistributionChart;