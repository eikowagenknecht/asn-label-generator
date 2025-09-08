import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { labelInfo } from "../../config/avery-labels";
import type { LabelGeneratorOptions } from "../../types/label-info";
import { BrowserPDFGenerator } from "../BrowserPDFGenerator";
import { type WebFormData, webFormSchema } from "../validation";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";

export function LabelGeneratorForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const form = useForm({
    resolver: zodResolver(webFormSchema),
    defaultValues: {
      startAsn: 1,
      format: "averyL4731" as const,
      border: false,
      topDown: false,
      numLabels: undefined,
      pages: 1,
      digits: 6,
      skip: 0,
      prefixQR: "ASN",
      prefixPrint: undefined,
      customPrintPrefix: false,
      offsetX: 0,
      offsetY: 0,
      scaleX: 100, // Store as percentage in form
      scaleY: 100, // Store as percentage in form
      marginX: 1,
      marginY: 1,
    },
  });

  const onSubmit = async (data: WebFormData) => {
    setIsGenerating(true);
    setProgress(0);
    try {
      const labelFormat = labelInfo[data.format];
      if (!labelFormat) {
        throw new Error(`Invalid label format: ${data.format}`);
      }
      const labelsPerPage = labelFormat.numLabels.x * labelFormat.numLabels.y;

      // Use skip directly in labels
      const skipInLabels = data.skip;

      const generatorOptions: LabelGeneratorOptions = {
        format: data.format,
        border: data.border,
        topDown: data.topDown,
        startAsn: data.startAsn,
        digits: data.digits,
        prefixQR: data.prefixQR,
        prefixPrint: data.customPrintPrefix
          ? (data.prefixPrint ?? data.prefixQR)
          : data.prefixQR,
        offset: { x: data.offsetX, y: data.offsetY },
        scale: { x: data.scaleX, y: data.scaleY },
        margin: { x: data.marginX, y: data.marginY },
        skip: skipInLabels,
      };

      const generator = new BrowserPDFGenerator(generatorOptions);

      const count = data.numLabels ?? data.pages * labelsPerPage;

      // Use the base class renderLabels method with progress callback
      await generator.renderLabels(count, (progress: number) => {
        setProgress(progress);
      });

      setProgress(100);
      await generator.save("labels.pdf");

      console.log(`Generated ${String(count)} labels`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-4 rounded-lg mb-6">
        <p className="text-sm text-muted-foreground mb-3">
          Generate PDF sheets of labels with ASN numbers and QR codes for
          paperless-ngx. When you scan a document with these labels,
          paperless-ngx automatically assigns unique identifiers.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge>Format: Avery L4731 (189 labels/page)</Badge>
          <Badge>Size: 25.4×10mm each</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Label Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void form.handleSubmit(onSubmit)(e);
              }}
              className="space-y-8"
            >
              {/* 1. Number of Pages */}
              <FormField
                control={form.control}
                name="pages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Pages</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          field.onChange(+e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Pages to generate (189 labels per A4 page)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 2. Number of Digits */}
              <FormField
                control={form.control}
                name="digits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Digits</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          field.onChange(+e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Zero-padded digits in ASN numbers (6 = ASN000001)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 3. Ordering */}
              <FormField
                control={form.control}
                name="topDown"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel>Top-down ordering</FormLabel>
                      <FormDescription>
                        Order labels by column instead of row
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* 4. Label Prefix */}
              <FormField
                control={form.control}
                name="prefixQR"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label Prefix</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Prefix for both QR code and printed label (e.g., ASN, P,
                      B)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 5. Starting ASN Number */}
              <FormField
                control={form.control}
                name="startAsn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting ASN Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          field.onChange(+e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      The first ASN number to generate (e.g., 1 for ASN000001)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Advanced Label Control */}
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between font-medium [&[data-state=open]>svg]:rotate-180">
                  Advanced Label Options
                  <ChevronDown className="h-4 w-4 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="skip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skip Labels</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => {
                                field.onChange(+e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Skip first N labels (useful for finishing partially printed sheets)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numLabels"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exact Number of Labels</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Leave empty to use pages"
                              {...field}
                              onChange={(e) => {
                                field.onChange(
                                  e.target.value === ""
                                    ? undefined
                                    : +e.target.value,
                                );
                              }}
                              value={field.value?.toString() ?? ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Generate exact number of labels instead of full
                            pages
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Label Content Spacing */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="marginX"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>X Margin (mm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              onChange={(e) => {
                                field.onChange(+e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Inner spacing between label content and edges
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="marginY"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Y Margin (mm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              onChange={(e) => {
                                field.onChange(+e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Inner spacing between label content and edges
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Custom Print Prefix */}
                  <FormField
                    control={form.control}
                    name="customPrintPrefix"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel>
                            Use different prefix for printed labels
                          </FormLabel>
                          <FormDescription>
                            Show different text on label than in QR code
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("customPrintPrefix") && (
                    <FormField
                      control={form.control}
                      name="prefixPrint"
                      render={({ field }) => (
                        <FormItem className="ml-6">
                          <FormLabel>Printed Label Prefix</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={form.watch("prefixQR") || "ASN"}
                            />
                          </FormControl>
                          <FormDescription>
                            Different prefix shown on label (QR code will still
                            use "{form.watch("prefixQR") || "ASN"}")
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Printer Alignment */}
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between font-medium [&[data-state=open]>svg]:rotate-180">
                  Printer Alignment
                  <ChevronDown className="h-4 w-4 transition-transform" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Adjust these values if labels don't align properly with your
                    printer.
                  </p>

                  {/* Show borders checkbox */}
                  <FormField
                    control={form.control}
                    name="border"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel>Show borders</FormLabel>
                          <FormDescription>
                            Show label boundaries to test printer alignment
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="offsetX"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>X Offset (mm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              onChange={(e) => {
                                field.onChange(+e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Move all labels left/right on page
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="offsetY"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Y Offset (mm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              onChange={(e) => {
                                field.onChange(+e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Move all labels up/down on page
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scaleX"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>X Scale (%)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.1"
                                min="10"
                                max="200"
                                {...field}
                                value={field.value?.toString() ?? ""}
                                onChange={(e) => {
                                  field.onChange(+e.target.value);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Stretch labels horizontally (100% = normal size)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scaleY"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Y Scale (%)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.1"
                                min="10"
                                max="200"
                                {...field}
                                value={field.value?.toString() ?? ""}
                                onChange={(e) => {
                                  field.onChange(+e.target.value);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Stretch labels vertically (100% = normal size)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Example printer adjustments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">
                          Brother HL-L2350DW:
                        </span>
                        <Badge variant="secondary">Y Offset: -0.5</Badge>
                        <Badge variant="secondary">Y Scale: 99.4%</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              {/* Progress Indicator */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Generating PDF...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Submit Button */}
              <div className="border-t pt-6">
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating PDF... {Math.round(progress)}%
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏷️</span>
                      Generate Labels
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        <p>
          Compatible with Avery L4731 label sheets • Works with paperless-ngx
          document management
        </p>
      </div>
    </div>
  );
}
